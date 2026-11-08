# Local backups

Workout and bodyweight data is stored in this browser's local storage, not in GitHub or a cloud account. Clearing browser/site data or switching devices does not transfer the records automatically.

On the home screen, **Copy backup** copies a complete, versioned JSON backup containing workouts, recorded sets and effort, timestamps, and bodyweight records. Open your private backup text file in Google Drive, replace all its old contents with the copied text, and save it. Do not append backups to each other. Copying does not update Drive automatically. If clipboard access fails, the app displays selectable text for manual copying. The app records the last successful automatic copy and shows a weekly reminder while open; it cannot verify a Drive save or send background reminders.

To restore, choose **Restore backup**, paste the entire text from your file, and choose **Review backup**. A JSON file picker is also available. Review the backup date and record counts, then explicitly confirm replacement. Cancel leaves current records untouched. Restore replaces rather than merges local records; copy and save current data first if needed. Malformed and unsupported backups are rejected before replacement. The existing Google Sheets clipboard export is separate and is not a restore backup.

Run `npm test` for backup format/validation/reminder tests, `npm run lint` for lint checks, and `npm run build` for the production build.
