import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

const PLIST_LABEL = 'com.freshquota.trigger';

export function plistPath() {
  return join(homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`);
}

export function buildPlist(anchors, scriptPath, logDir) {
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

export function computeNextWake(anchors, now = new Date()) {
  const anchorList = Array.isArray(anchors) ? anchors : [anchors];

  const wakes = anchorList.map(anchor => {
    const [hours, minutes] = anchor.split(':').map(Number);
    const wake = new Date(now);
    wake.setHours(hours, minutes - 2, 0, 0); // 2 min before anchor
    if (wake <= now) {
      wake.setDate(wake.getDate() + 1);
    }
    return wake;
  });

  return wakes.reduce((earliest, w) => (w < earliest ? w : earliest));
}

function formatPmsetDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  const HH = String(date.getHours()).padStart(2, '0');
  const MM = String(date.getMinutes()).padStart(2, '0');
  const SS = String(date.getSeconds()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy} ${HH}:${MM}:${SS}`;
}

export function registerLaunchd(plistContent) {
  const dest = plistPath();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, plistContent);

  const uid = process.getuid();
  try {
    execSync(`launchctl bootout gui/${uid} ${dest}`, { stdio: 'ignore' });
  } catch {
    // may not be loaded yet, ignore
  }
  execSync(`launchctl bootstrap gui/${uid} ${dest}`);
}

export function unregisterLaunchd() {
  const dest = plistPath();
  const uid = process.getuid();
  try {
    execSync(`launchctl bootout gui/${uid} ${dest}`, { stdio: 'ignore' });
  } catch { /* not loaded */ }
  try {
    unlinkSync(dest);
  } catch { /* not found */ }
}

export function schedulePmsetWake(anchors) {
  const wake = computeNextWake(anchors);
  const dateStr = formatPmsetDate(wake);
  execSync(`sudo pmset schedule wake "${dateStr}"`);
  return wake;
}

export function cancelPmsetSchedules() {
  try {
    execSync('sudo pmset schedule cancelall', { stdio: 'ignore' });
  } catch {
    // may fail if no schedules or no sudo — best effort
  }
}
