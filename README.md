# KF-MedReminder

> 親の薬管理をサポートする服薬リマインダーアプリ。

## The Problem

親や家族の薬管理が心配。飲み忘れや二重服用を防ぎたい。

## How It Works

1. 薬名・用量・服薬タイミング（朝/昼/夕/就寝前）を登録
2. 設定した時間にブラウザ通知でリマインド
3. 「飲みました」ボタンで服薬を記録
4. 月次サマリで服薬率を確認
5. CSV形式で履歴をエクスポート可能

## Technologies Used

- **HTML + CSS + JavaScript** — PWA対応のバニラJS
- **Notification API** — ブラウザ通知による服薬リマインド
- **Service Worker** — オフライン対応
- **LocalStorage** — 全データをブラウザに保存（サーバー不要）

## Development

```bash
npx serve .
```

## Deployment

Hosted on [Cloudflare Pages](https://pages.cloudflare.com/).

---

Part of the [KaleidoFuture AI-Driven Development Research](https://kaleidofuture.com) — proving that everyday problems can be solved with existing libraries, no AI model required.
