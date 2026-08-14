"""QLoRA supervised fine-tune for strict grounding, on one RTX 4090.

Trains only on the assistant turn — the model should learn to produce grounded
answers, not to reproduce the clinical documents it was shown.

    python train.py                    # defaults below
    python train.py --epochs 2 --lr 1e-4

Checkpoints land in out/ (git-ignored). Nothing here needs the network once the
base model is cached.
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import torch
from datasets import Dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    DataCollatorForSeq2Seq,
    Trainer,
    TrainingArguments,
)

ROOT = Path(__file__).resolve().parent
BASE = "Qwen/Qwen2.5-7B-Instruct"  # strong Korean + English, fits 24GB in 4-bit
OUT = ROOT / "out"


def load_rows(p: Path) -> list[dict]:
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


def build(tok, rows: list[dict], max_len: int) -> Dataset:
    """Mask everything but the assistant turn, so loss is on the answer only."""
    feats = []
    skipped = 0
    for r in rows:
        msgs = r["messages"]
        prompt = tok.apply_chat_template(msgs[:-1], tokenize=False, add_generation_prompt=True)
        full = prompt + msgs[-1]["content"] + tok.eos_token

        p_ids = tok(prompt, add_special_tokens=False)["input_ids"]
        f_ids = tok(full, add_special_tokens=False)["input_ids"]
        if len(f_ids) > max_len:
            skipped += 1
            continue
        labels = [-100] * len(p_ids) + f_ids[len(p_ids):]
        feats.append({"input_ids": f_ids, "attention_mask": [1] * len(f_ids), "labels": labels})
    if skipped:
        print(f"  skipped {skipped} example(s) longer than {max_len} tokens")
    return Dataset.from_list(feats)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=BASE)
    ap.add_argument("--epochs", type=float, default=3.0)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--rank", type=int, default=32)
    ap.add_argument("--max-len", type=int, default=4096)
    ap.add_argument("--batch", type=int, default=1)
    ap.add_argument("--accum", type=int, default=8)
    args = ap.parse_args()

    train_rows = load_rows(ROOT / "data" / "train.jsonl")
    print(f"train examples: {len(train_rows)}")

    tok = AutoTokenizer.from_pretrained(args.base, trust_remote_code=True)
    tok.pad_token = tok.pad_token or tok.eos_token
    tok.padding_side = "right"

    ds = build(tok, train_rows, args.max_len)
    print(f"tokenized: {len(ds)} · median length "
          f"{sorted(len(x['input_ids']) for x in ds)[len(ds) // 2]} tokens")

    model = AutoModelForCausalLM.from_pretrained(
        args.base,
        quantization_config=BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        ),
        dtype=torch.bfloat16,
        device_map={"": 0},
        trust_remote_code=True,
        attn_implementation="sdpa",
    )
    model.config.use_cache = False
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True)
    model = get_peft_model(model, LoraConfig(
        r=args.rank,
        lora_alpha=args.rank * 2,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
    ))
    model.print_trainable_parameters()

    OUT.mkdir(exist_ok=True)
    t0 = time.perf_counter()
    trainer = Trainer(
        model=model,
        train_dataset=ds,
        args=TrainingArguments(
            output_dir=str(OUT / "ckpt"),
            num_train_epochs=args.epochs,
            per_device_train_batch_size=args.batch,
            gradient_accumulation_steps=args.accum,
            learning_rate=args.lr,
            lr_scheduler_type="cosine",
            warmup_ratio=0.05,
            logging_steps=5,
            save_strategy="no",
            bf16=True,
            gradient_checkpointing=True,
            gradient_checkpointing_kwargs={"use_reentrant": False},
            optim="paged_adamw_8bit",
            report_to=[],
        ),
        data_collator=DataCollatorForSeq2Seq(tok, padding=True, label_pad_token_id=-100),
    )
    res = trainer.train()
    mins = (time.perf_counter() - t0) / 60

    adapter = OUT / "adapter"
    model.save_pretrained(adapter)
    tok.save_pretrained(adapter)

    (OUT / "train_meta.json").write_text(json.dumps({
        "base": args.base,
        "examples": len(ds),
        "epochs": args.epochs,
        "lr": args.lr,
        "lora_rank": args.rank,
        "final_loss": round(res.training_loss, 4),
        "minutes": round(mins, 1),
        "gpu": torch.cuda.get_device_name(0),
    }, indent=2), encoding="utf-8")

    print(f"\nfinal loss {res.training_loss:.4f} · {mins:.1f} min · adapter → {adapter}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
