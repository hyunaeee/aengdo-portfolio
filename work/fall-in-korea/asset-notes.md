# Fall in Korea — 원본 이미지 제작 기록

이하 메모는 게임의 초기 이름인 도담 공방부터의 제작 기록입니다. 문서 안의 소스 경로는 원본 프로젝트 기준이며, 이 체험판의 이미지는 `game/assets/`에 있습니다.

2026-09-11. 전통 아이템, 캐릭터, 배경과 홈 화면 아이콘은 OpenAI 내장 이미지 생성 모델로 제작했습니다. 사용자가 제공한 모바일 머지 게임 스크린샷은 세로 화면 구성과 입체 아이템의 방향을 잡는 참고로 사용했습니다. 스크린샷의 캐릭터나 아이템을 잘라서 사용하지 않았습니다.

## 현재 사용하는 이미지

| 파일 | 실제 크기 | 용도 |
|---|---|---|
| `public/assets/korean-items-a.png` | 1374 × 1145, RGBA | 6열 × 5행, 전통 공예 30종 |
| `public/assets/korean-items-b.png` | 1374 × 1145, RGBA | 6열 × 5행, 전통 공예·먹거리 30종 |
| `public/assets/korean-characters.png` | 1402 × 1122, RGBA | 동물 15종과 소품 5종 |
| `public/assets/hanok-scene.png` | 1024 × 1536, RGB | 단청 처마·청사초롱·한옥 마당·비취색 마루 |
| `public/app-icon.png` | 1254 × 1254, RGB | 노리개를 안은 까치, iPhone 홈 화면·PWA 아이콘 |
| `public/assets/ui-atlas.png` | 1448 × 1086, RGBA | 앞 버전에서 생성한 범용 파란 번개·미션 메달 |

투명 PNG는 실제 알파 채널을 확인했습니다. 모델의 출력 크기는 요청 크기와 다를 수 있으므로 표에는 실제 크기를 기록했습니다. 앱 아이콘은 생성 원본을 사용하며 브라우저가 표시 크기에 맞춥니다.

## 아이템 아틀라스

각 행의 왼쪽부터 1~6단계입니다. 초기 전통 아이템 60개 이름은 원본 `src/content.js`와 `docs/KOREAN_CONTENT.md`에 있습니다.

| 아틀라스 | 행 | 계열 |
|---|---:|---|
| A | 1 | 매듭 → 노리개 |
| A | 2 | 조각보 |
| A | 3 | 청자 |
| A | 4 | 한복 |
| A | 5 | 전통 부채 |
| B | 1 | 나전칠기 |
| B | 2 | 오색 떡 |
| B | 3 | 한과 |
| B | 4 | 전통차 |
| B | 5 | 한지 등 |

모델이 일부 아이템을 셀 경계 밖까지 그려 고정 격자로 표시하면 노리개의 술이나 부채 끝이 잘렸습니다. PNG를 수정하지 않고 알파 연결 영역을 읽어 개별 경계를 구했습니다. `public/assets/korean-items.metadata.json`의 60개 사각형을 `src/sprite-data.js`에 옮겼으며 `src/app-v3.js`의 `cropArt()`가 원래 종횡비를 유지해 표시합니다.

## 캐릭터·소품 아틀라스

| 행 | 왼쪽 → 오른쪽 |
|---:|---|
| 1 | 까치, 호랑이, 해태, 봉황, 용 |
| 2 | 쥐, 소, 토끼, 뱀, 말 |
| 3 | 양, 원숭이, 닭, 개, 돼지 |
| 4 | 복주머니, 한옥, 공예 도구함, 엽전, 옥 보석 |

캐릭터도 `public/assets/korean-characters.metadata.json`의 개별 경계를 사용합니다. 십이지신 12종과 까치·해태·봉황 3종을 합쳐 마을 친구 15종으로 구성했습니다. 손님 주문, 친구 도감, 좋아하는 선물 연결에 같은 그림과 데이터를 사용합니다.

## 생성 프롬프트

- [아이템 A](../public/assets/korean-items-a.prompt.txt)
- [아이템 B](../public/assets/korean-items-b.prompt.txt)
- [캐릭터와 소품](../public/assets/korean-characters.prompt.txt)
- [한옥 배경](../public/assets/hanok-scene.prompt.txt)
- [앱 아이콘](../public/assets/app-icon.prompt.txt)
- [이전 범용 UI](../public/assets/ui-atlas.prompt.txt)

아이콘은 초기 생성 후 같은 이미지 모델로 구도를 한 차례 조정해 까치와 노리개가 안전 영역에 들어오도록 했습니다. Python이나 픽셀 편집으로 배경을 제거하거나 그림을 다시 칠하지 않았습니다.

## 전통 소재 참고

합성 순서는 게임을 위한 창작 구성입니다. 실제 공예품의 제조 공정이나 역사적 발달 순서를 재현하는 교육 자료로 설명하지 않습니다. 청자 매병의 구름·학 무늬는 [국립중앙박물관의 청자 구름 학 무늬 매병 소개](https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=254445&schM=view)에서 소재 명칭을 참고했습니다. 박물관 사진을 게임 이미지로 사용하지 않았습니다.

기존 `cafe-scene.png`, `items-atlas.png`와 이전 화면 파일은 작업 이력으로 남아 있습니다. 현재 진입점과 서비스 워커는 한국형 자산을 불러옵니다.

## v4 — Fall in Korea 여행 이미지

2026-09-12. 아래 4개 이미지를 OpenAI 내장 `image_gen` 도구로 새로 제작했습니다. 위의 v3 제작 기록과 기존 한국 전통 자산은 보존하고, 시대별 여행 지도·건물·현대 아이템·이벤트에 이 자산을 추가했습니다. 최종 PNG는 도구가 반환한 생성 결과를 프로젝트로 복사한 원본이며, 크기 변경이나 코드로 배경을 지우는 픽셀 편집은 하지 않았습니다.

| 저장 경로 | 확인한 실제 크기 | 구성 | 실제 생성 프롬프트 | 개별 이미지 경계 메타데이터 |
|---|---|---|---|---|
| [`public/assets/korea-travel-map.png`](../public/assets/korea-travel-map.png) | 724 × 2172, RGB | 1:3 세로 여행 지도 배경 | [초기 생성·최종 수정 프롬프트](../public/assets/korea-travel-map.prompt.txt) | 없음 — 단일 배경 이미지 |
| [`public/assets/korea-buildings.png`](../public/assets/korea-buildings.png) | 1086 × 1448, RGBA | 3열 × 4행, 건물·장소 12종 | [건물 프롬프트](../public/assets/korea-buildings.prompt.txt) | [`korea-buildings.metadata.json`](../public/assets/korea-buildings.metadata.json) |
| [`public/assets/modern-items.png`](../public/assets/modern-items.png) | 1536 × 1024, RGBA | 6열 × 4행, 현대 아이템 24종 | [현대 아이템 프롬프트](../public/assets/modern-items.prompt.txt) | [`modern-items.metadata.json`](../public/assets/modern-items.metadata.json) |
| [`public/assets/travel-events.png`](../public/assets/travel-events.png) | 1774 × 887, RGBA | 4열 × 2행, 여행 이벤트·상점 아이콘 8종 | [이벤트 최종 생성 프롬프트와 제작 기록](../public/assets/travel-events.prompt.txt) | [`travel-events.metadata.json`](../public/assets/travel-events.metadata.json) |

지도는 아래의 전통 마을에서 개항 도시, 추억의 거리, 현대 강변으로 이어지는 길과 빈 공터를 그린 배경입니다. 초기 출력에 포함된 전경 한옥·대문과 상단 큰 건물을 같은 이미지 모델의 편집 기능으로 제거해, 게임이 건물 스프라이트를 별도로 배치할 수 있게 했습니다.

건물은 `src/travel-content.js`의 `BUILDINGS` 순서와 같습니다. 각 행은 왼쪽에서 오른쪽 순서입니다.

| 행 | 시대 | 건물·장소 |
|---:|---|---|
| 1 | 조선의 마을 | 한옥 대문, 한옥 찻집, 연못 정자 |
| 2 | 개항 도시 | 개항역, 벽돌 다방, 여행 우체국 |
| 3 | 추억의 거리 | 골목 극장, 레코드 가게, 추억의 오락실 |
| 4 | 오늘의 한국 | 서울 전망대, K팝 스튜디오, 한강 피크닉 |

현대 아이템의 4개 행은 사진 여행, 한국의 음악, 디지털 한국, 길거리 간식이며, 각 행의 왼쪽부터 1~6단계입니다. 아이템 이름과 해금 조건은 `src/travel-content.js`의 `MODERN_CHAINS`에 있습니다. 이벤트 아틀라스는 첫 행에 여행 여권·황금 여행 패스·첫 여행 선물·여행 사진 앨범, 둘째 행에 윷놀이·짝꿍 카드·여행 에너지·기념품 쇼핑백을 담았습니다. 윷놀이 아이콘은 네 개의 윷이 모두 보이는 최종 생성본을 사용합니다.

건물·현대 아이템·이벤트 PNG 모두 실제 32비트 RGBA이며 모서리 알파 값이 0인 것을 확인했습니다. 메타데이터에는 원본 경로 `src`, 실제 `width`·`height`, 행 우선 순서의 `items` 배열과 각 항목의 `{x, y, width, height}`가 들어 있습니다. 건물 12종은 알파 > 24의 연결 영역을 읽어 구했고, 현대 아이템 24종과 이벤트 8종은 알파 > 150의 연결 영역을 행·열별로 합친 뒤 3픽셀 여백을 더했습니다. 이 과정은 PNG를 읽어 경계 정보만 계산하며 원본 픽셀을 변경하지 않습니다.

v4는 경계 정보를 `src/travel-sprite-data.js`에서 참조하고 `src/art-v4.js`의 `crop()`으로 원래 종횡비를 유지해 표시합니다. 특히 전망대처럼 셀 경계를 넘는 그림은 고정 격자로 자르지 않고 개별 경계를 사용합니다.

## 좌우 탐색 지도와 부드러운 안개

2026-09-12. 좌우로도 이동하는 여행 지도와 수증기처럼 흐린 미발견 지역 표현을 위해 아래 두 이미지를 OpenAI 내장 `image_gen` 도구로 추가 제작했습니다. 기존 `korea-travel-map.png`는 보존했습니다.

| 저장 경로 | 확인한 실제 크기 | 용도 | 실제 생성 프롬프트 |
|---|---|---|---|
| [`public/assets/korea-travel-map-wide.png`](../public/assets/korea-travel-map-wide.png) | 887 × 1774, RGB | 중앙 여행길과 시대별 공터를 유지하며 좌우 한국풍 숲·정원·해안을 확장한 1:2 지도 | [지도 확장 편집 프롬프트](../public/assets/korea-travel-map-wide.prompt.txt) |
| [`public/assets/korea-map-mist.png`](../public/assets/korea-map-mist.png) | 1774 × 887, RGBA | 불규칙한 흰색·옅은 청회색 수증기 안개 오버레이 | [안개 생성 프롬프트](../public/assets/korea-map-mist.prompt.txt) |

넓은 지도는 기존 지도 PNG를 직접 확인한 뒤 편집 대상으로 전달했습니다. 중앙의 연결된 길·공터·돌다리·부두와 아래 전통 마을에서 위 현대 강변으로 이어지는 진행을 유지하면서 좌우 풍경을 확장했습니다. 안개는 별도의 신규 이미지로 만들었으며, 반복되는 타원형 구름 대신 비대칭 수증기와 부드러운 가장자리를 요청했습니다.

안개 PNG의 실제 알파를 전체 픽셀에서 확인했습니다. 완전 투명 픽셀은 721,058개, 반투명 픽셀은 852,480개, 완전 불투명 픽셀은 0개이며 255개의 서로 다른 알파 값을 사용합니다. 모서리 알파는 0, 중앙 알파는 253입니다. 두 이미지 모두 생성 결과를 그대로 복사했으며 프로그램으로 배경을 제거하거나 픽셀을 다시 그리지 않았습니다. 단일 배경·오버레이 이미지이므로 별도의 아틀라스 경계 메타데이터는 없습니다.
