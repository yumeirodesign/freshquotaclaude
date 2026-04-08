ソースを確認しました。複数アンカー対応が反映済みのリポジトリですね。以下が新しい README.md です。

```markdown
# freshquota

Claude Code の 5 時間ローリングウィンドウ枠を最適なタイミングで自動起動し、Mac がスリープ中でもクォータをリフレッシュするツールです。

## 仕組み

Claude Code サブスクリプションの使用量クォータは、最初に使った時点から 5 時間で リセットされます。例えば朝 9 時に使い始めると、リセットは 14 時です。

freshquota は、あなたが作業を始める前（例えば早朝 7 時）に自動でウィンドウを起動します。すると 12 時にリセットが来て、午後の作業ピークをフルクォータで迎えられます。

さらに **複数のアンカー時刻** を設定すれば、1 日に複数回ウィンドウを起動し、クォータのリセットタイミングを細かくコントロールできます。

## 必要環境

- macOS（launchd + pmset によるスケジューリング）
- Node.js >= 18
- Claude Code CLI がインストール・認証済みであること
- sudo アクセス（pmset wake の登録に初回のみ必要）

## インストール

```bash
npm install -g github:yumeirodesign/freshquotaclaude
```

## 使い方

### 1. 使用パターンを分析する

```bash
freshquota analyze
```

過去 14 日間の時間帯別使用分布を表示し、最適なアンカー時刻を提案します。

手動で設定する場合:

```bash
# 単一のアンカー時刻
freshquota analyze --anchor 07:30

# 複数のアンカー時刻（カンマ区切り）
freshquota analyze --anchor 07:30,13:00,19:00
```

### 2. スケジュールを有効化する

```bash
freshquota install
```

launchd ジョブを登録し、pmset wake をスケジュールします。pmset のために sudo が必要です。

### 3. 状態を確認する

```bash
freshquota status
```

現在のアンカー設定、最後のトリガー結果、次回のウェイク時刻などを表示します。

### 4. 手動トリガー

```bash
freshquota trigger
```

ウィンドウがまだアクティブでなければ、即座に Claude Code を起動してウィンドウを開始します。

### 5. ヘルスチェック

```bash
freshquota doctor
```

スケジューリングチェーン（launchd plist・pmset wake）が正常かを検証し、問題があれば報告します。

### 6. アンインストール

```bash
freshquota uninstall
```

launchd ジョブ、pmset スケジュール、状態ファイルをすべて削除します。CLI 本体も削除するには:

```bash
npm uninstall -g freshquota
```

## スケジューリングの流れ

1. `pmset schedule wake` が設定時刻の 2 分前に Mac を起こす（蓋を閉じていても動作）
2. `launchd` が起動を検知し `freshquota run` を実行
3. 5 時間以内にすでにトリガー済みならスキップ
4. ウィンドウがアクティブならスキップ
5. いずれでもなければ、最小限の Claude CLI リクエストを送信してウィンドウを開始
6. 次回の pmset wake をスケジュール
7. Mac がスリープに戻る

複数アンカーを設定した場合、launchd が各時刻に `freshquota run` を呼び出し、前回トリガーから 5 時間以上経過していれば再度トリガーします。

## 複数アンカーの設定例

```bash
# 朝・昼・夕の 3 回に設定
freshquota analyze --anchor 07:00,12:00,17:00
freshquota install
```

この設定では:

| アンカー時刻 | ウィンドウ起動 | クォータリセット |
|---|---|---|
| 07:00 | 07:00 | 12:00 |
| 12:00 | 12:00 | 17:00 |
| 17:00 | 17:00 | 22:00 |

作業時間帯に合わせてリセットが来るように調整できます。

## Fork 元

[anniebuildz/freshquota](https://github.com/anniebuildz/freshquota) を元に、複数アンカー時刻への対応を追加しています。

## License

MIT
```

元の README からの主な変更点は、インストール先 URL を `yumeirodesign/freshquotaclaude` に修正したこと、複数アンカーの使い方とカンマ区切りの記法を全体にわたって記載したこと、スケジューリングの流れの説明を 5 時間判定ベースに更新したこと、具体的な設定例をテーブルで追加したこと、そして Fork 元への参照を入れたことです。
