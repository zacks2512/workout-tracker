# Local backups

Workout and bodyweight data is stored in this browser's local storage, not in GitHub or a cloud account. Clearing browser/site data or switching devices does not transfer the records automatically.

On the home screen, **Backup & restore** downloads a versioned JSON backup containing workouts, recorded sets and effort, timestamps, and bodyweight records. Keep a private copy in Files, Google Drive, or iCloud. The app records the last export request and shows a weekly reminder while open; it cannot verify that the download was saved or send background reminders.

To restore, choose the JSON file, review its date and record counts, then explicitly confirm replacement. Cancel leaves current records untouched. Restore replaces rather than merges local records; download current data first if needed. Malformed and unsupported files are rejected before replacement. The existing Google Sheets clipboard export is separate and is not a restore file.

Run `npm test` for backup format/validation/reminder tests, `npm run lint` for lint checks, and `npm run build` for the production build.
