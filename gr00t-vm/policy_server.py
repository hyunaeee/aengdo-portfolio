from pathlib import Path

import torch
from huggingface_hub import snapshot_download
from gr00t.data.embodiment_tags import EmbodimentTag
from gr00t.policy.gr00t_policy import Gr00tPolicy, Gr00tSimPolicyWrapper
from gr00t.policy.server_client import PolicyServer


if __name__ == "__main__":
    model_dir = Path("/models/n16")
    snapshot_download(
        repo_id="nvidia/GR00T-N1.6-3B",
        revision="d0814e7ecb19202e7c8468b46098b0b7ef3a6d61",
        local_dir=model_dir,
    )
    # Let the upstream policy load and cast its checkpoint to BF16 in system
    # RAM before moving the finished model to this machine's shared GPU.
    policy = Gr00tPolicy(EmbodimentTag.GR1, str(model_dir), device="cpu")
    policy.model.to("cuda:0")
    print(f"Running GR00T N1.6 on {torch.cuda.get_device_name(0)} in {policy.model.dtype}.")
    server = PolicyServer(policy=Gr00tSimPolicyWrapper(policy), host="0.0.0.0", port=5555)
    server.run()
