// anchor を配列（例: ["07:30", "13:00", "19:00"]）で受け取るように変更
export function buildPlist(anchors, scriptPath, logDir) {
  // 単一文字列の場合は配列に変換
  const anchorList = Array.isArray(anchors) ? anchors : [anchors];

  const intervals = anchorList.map(anchor => {
    const [hours, minutes] = anchor.split(':').map(Number);
    return `    <dict>
      <key>Hour</key>
      <integer>${hours}</integer>
      <key>Minute</key>
      <integer>${minutes}</integer>
    </dict>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${scriptPath}</string>
    <string>run</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
${intervals}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${logDir}/launchd.stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${logDir}/launchd.stderr.log</string>
</dict>
</plist>`;
}
