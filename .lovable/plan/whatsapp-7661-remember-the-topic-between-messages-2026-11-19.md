# WhatsApp 7661: remember the topic between messages

## What production shows (read-only)
- The site received only 2 signed WhatsApp messages in that window: 11:40:38 UTC (13:40 Cairo) and 11:41:19 UTC (13:41:18). Both were recorded once and replied to, from the same sender.
- **No request reached the site at 13:41:04 ("والسعر كام").** The text "دي رسالة تلقائية من فريق مسارات" doesn't exist anywhere in the project. So that welcome came from outside this app. The most likely source is an auto-reply or flow configured in Twilio for that number. I can't see Twilio settings from here.
- At 13:41:18, "السعر كام" got the program question for one reason: the topic from 13:40 was held only in the memory of one server copy. The reply ran on a different copy, which had no topic. The wording itself is fine. Price intent and the leading "و" are both detected correctly.

## Changes (WhatsApp support only)
1. **Database change through the project's managed migration (0067):**
   - A private table `support_private.topic_context` holding only a hashed key and a tiny topic record. The topic record has allow-listed codes only: subject, area, program, plan, market, term, lesson id.
   - Entries expire after 30 minutes.
   - Two functions only the server can call: read a topic and save a topic. They validate the key format and the topic size and fields.
   - No phone numbers, names or message text are stored. Nobody signed in or signed out can read it.
2. **A durable topic store** in the support code, built on those two functions.
   - The key stays the existing hash of channel + hashed sender + private visibility, so another sender or a public thread can never share it.
   - If the database is unavailable, it falls back to the current memory-only behaviour and never fails the reply.
3. **WhatsApp uses the durable store.** Meta channels are unchanged.
4. **Greetings:**
   - A bare greeting ("اهلا", "السلام عليكم", "hi") gets one short greeting with the official link and signature.
   - A real question never gets a standalone welcome.
5. Signed requests, the once-per-message check, reply limits and the single official link plus signature stay as they are.

## Tests (WhatsApp, real database rules in a throwaway test database, two separate simulated servers)
- "عندكم إيه في التعليم الفني؟" on server A, then "والسعر كام" on server B. B stays on the technical path and asks only whether they're inside or outside Egypt. Then "في مصر" gives 309 جنيه a month / 3090 a year, with the `/technical/pricing` link and signature.
- "التعليم الفني عندكم بيبداء بايه؟" then "طب وبكام في مصر؟" across two servers gives the technical price.
- A different sender asking "والسعر كام" doesn't inherit the topic.
- Delivering the same message twice gives one reply.
- A greeting gets a greeting. A question never gets a welcome.
- The stored topic holds only allow-listed codes and expires.

## Release
- Run the support tests and check the build.
- Report the commit and its difference from the live release (99d49f26), which should be support files plus migration 0067 only.
- Restore any automatic platform file changes first.
- No publish: you press Publish after reviewing. Twilio, Meta and the schedules aren't touched.
- **Owner action:** check the 7661 number in the Twilio Console for any auto-reply, Studio flow or Messaging Service reply that sends "دي رسالة تلقائية من فريق مسارات", and remove it so only the site answers.
