# MöbelPlan 독일 App Store ASO 초안

데이터 기준: 2026-09-28  
대상 스토어: Germany / German  
상태: iOS 네이티브 앱 출시 전 준비용. 현재 웹 MVP는 그대로 App Store에 제출할 수 있는 완성 앱이 아니다.

## 메타데이터

### App Name — 28자 / 최대 30자

`MöbelPlan: Möbel & Lieferung`

브랜드명과 핵심 가치인 Möbel, Lieferung를 한 줄에 담는다.

### Subtitle — 27자 / 최대 30자

`Möbel vergleichen & liefern`

### Keywords — 84 UTF-8 bytes / 최대 100 bytes

`sofa,bett,schrank,tisch,lieferung,umzug,einrichtung,preisvergleich,warenkorb,wohnung`

쉼표 뒤 공백을 넣지 않는다. 앱 이름과 회사명은 키워드 필드에서 반복하지 않고, IKEA·OTTO·XXXLutz·Home24 같은 타사 상표도 키워드에 넣지 않는다.

### Promotional Text — 117자 / 최대 170자

`Möbel aus mehreren Shops vergleichen, echte Gesamtkosten sehen und als Sammellieferung für deine neue Wohnung planen.`

### Description

```text
Neue Wohnung, mehrere Möbelshops und kein Auto? MöbelPlan hilft dir, Möbel übersichtlich zu vergleichen und eine gemeinsame Lieferung zu planen.

HÄNDLER KLAR ERKENNEN
Bei jedem Produkt siehst du sofort, welcher Händler es verkauft. Keine versteckten Anbieter und keine unklaren Marktplatzangebote.

GESAMTKOSTEN VERSTEHEN
Vergleiche Artikelpreis und Händler-Versand getrennt. Wenn der Versandpreis noch von Postleitzahl oder Auswahl abhängt, zeigt MöbelPlan das offen an.

MÖBEL DIREKT VERGLEICHEN
Vergleiche bis zu drei Sofas, Betten, Schränke, Tische, Stühle oder Regale nach Preis, Maßen, Material, Farbe und Lieferoption.

EIN WARENKORB FÜR MEHRERE SHOPS
Plane Produkte verschiedener Händler in einem Universal-Warenkorb und passe die gewünschte Menge direkt an.

SAMMELLIEFERUNG PLANEN
Gib Postleitzahl, Etage, Aufzug und Wunschdatum an und erhalte eine unverbindliche MVP-Schätzung für die gebündelte Lieferung.

MöbelPlan ist ein unabhängiger Vergleichs- und Planungsdienst. Preise, Verfügbarkeit und Versandbedingungen können sich ändern und müssen vor dem Kauf auf der verlinkten Händlerseite geprüft werden. Im MVP werden keine Bestellungen oder Zahlungen ausgeführt.
```

## Screenshot 순서와 문구

첫 세 장만 봐도 핵심 가치가 전달되어야 한다.

1. 검색 결과: `Mehrere Shops. Eine Lieferung.`
2. 상품 카드 가격 영역: `Händler & Gesamtkosten sofort klar.`
3. 비교 화면: `Bis zu 3 Möbel direkt vergleichen.`
4. Universal Warenkorb: `Alle Shops in einem Warenkorb planen.`
5. 배송 견적: `Sammellieferung transparent kalkulieren.`
6. 수량 조절: `Mengen ändern. Summe sofort sehen.`

스크린샷에는 저작권이 불명확한 상품 사진을 넣지 않고 현재의 출처 확인형 카드 UI를 사용한다. 실제 판매처와 제휴한 것처럼 보이는 표현은 피한다.

## 아이콘 방향

- 현재 청록색 accent를 유지
- 흰색 바탕의 단순한 `M` 또는 상자 3개가 하나의 배송 경로로 합쳐지는 심볼
- 작은 크기에서도 보이도록 텍스트와 세부 선 최소화
- IKEA·OTTO 등 판매처 로고를 앱 아이콘에 넣지 않음

## 출시 후 ASO 실험

### 1차: 메시지

- Control: `Mehrere Shops. Eine Lieferung.`
- Treatment A: `Gesamtpreis statt Preisfalle.`
- Treatment B: `Neue Wohnung ohne Transportstress.`

한 번에 한 가지 가설만 바꾸고, App Store Connect의 Product Page Optimization에서 최대 3개 treatment를 비교한다. 충분한 노출이 쌓이기 전에는 승자를 단정하지 않는다.

### 2차: 타겟별 Custom Product Page

- Berufseinsteiger: 첫 직장과 새 집
- Studierende/Auszubildende: 첫 독립과 낮은 예산
- Young Professionals: 이직과 도시 이동

각 페이지는 광고 문구와 첫 스크린샷을 동일한 메시지로 맞춘다.

## 측정 지표

- App Store impressions → product page views
- Product page views → first-time downloads
- 다운로드 → 첫 상품 비교 완료
- 첫 상품 비교 → 장바구니 2개 이상
- 장바구니 → 배송 견적 제출
- 배송 견적 → 유료 예약

다운로드 수만 보지 않고 `유료 예약 / 스토어 노출`을 최종 ASO 품질 지표로 사용한다.

## Apple 공식 참고자료

- Product Page 작성: https://developer.apple.com/app-store/product-page/
- App Store Connect 메타데이터 제한: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/
- Product Page Optimization: https://developer.apple.com/app-store/product-page-optimization/
- Custom Product Pages: https://developer.apple.com/app-store/custom-product-pages/
