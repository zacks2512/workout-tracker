# Local backups

Workout and bodyweight data is stored in this browser's local storage, not in GitHub or a cloud account. Clearing browser/site data or switching devices does not transfer the records automatically.

On the home screen, **Copy backup** copies a complete, versioned JSON backup containing workouts, recorded sets and effort, timestamps, bodyweight records, dated meal completion and notes, activity records, and goal settings. Open your private backup text file in Google Drive, replace all its old contents with the copied text, and save it. Do not append backups to each other. Copying does not update Drive automatically. If clipboard access fails, the app displays selectable text for manual copying. The app records the last successful automatic copy and shows a weekly reminder while open; it cannot verify a Drive save or send background reminders.

To restore, choose **Restore backup**, paste the entire text from your file, and choose **Review backup**. A JSON file picker is also available. Review the backup date and record counts, then explicitly confirm replacement. Cancel leaves current records untouched. Restore replaces rather than merges local records; copy and save current data first if needed. Malformed and unsupported backups are rejected before replacement. The existing Google Sheets clipboard export is separate and is not a restore backup.

Run `npm test` for backup format/validation/reminder tests, `npm run lint` for lint checks, and `npm run build` for the production build.


## Daily tracker and compatibility

The app uses the same `workout-data` local storage key as before. Existing sessions and weigh-ins are read without deleting or rewriting their history. New daily logs and goal settings share that record so saving a set, note, or weigh-in preserves the other categories. Writes happen immediately; the UI reports storage failures.

New exports use backup version 2. The new app also accepts version 1 backups, including existing A/B/C sessions. Version 1 does not contain nutrition, activities, or goal settings: restoring it replaces all local data and resets these categories, with an explicit warning. Version 2 files must be restored using the updated app; old app versions cannot read them.

Daily dates use the device's local calendar day. Programs A/B/C remain available as legacy plans; new D/E programs are separate to preserve the meaning of historical exercises. Food quantities use cooked chicken/rice weights and dry oats. Friday has the adjusted lunch and family-meal guidance. Preparation totals follow the selected dates, including Friday.

The Today, Training, Progress, Prep, and Settings screens share the light Hebrew RTL theme. Meal notes save to their selected date. Activities can be recorded multiple times per date; manually logged activity minutes are not automatically combined with session durations. Preparation checkboxes are temporary for the current preparation list.
