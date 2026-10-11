# Privacy Notice

_Last updated: 2026-10-09_

This is my personal portfolio. I use submitted details to reply to messages and, if you choose,
to know who is interested in my CV. I do not sell these details or use them for marketing or
unrelated commercial purposes. Personal or non-commercial intent does not by itself exempt a
public website from GDPR.

## Controller and privacy contact

Esteban Beerens is the data controller. For privacy questions, access or deletion requests,
or withdrawal of CV logging consent, email **privacy@ebeerens.com**.

## What data is collected

| Form                     | Data collected                                                                                           | Purpose                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Contact form             | Full name, email, organization (optional), subject, message                                              | Reply to your message                                                                 |
| Optional CV request form | Full name, email and reason (all optional), submission time, consent time and wording version            | Know who is interested in my CV, with consent                                         |
| Anonymous download count | Timestamp of an issued download link                                                                     | Count downloads without linking events to requester details, IP addresses or browsers |
| Security processing      | Necessary technical information such as IP addresses and request metadata; transient verification tokens | Protect the site against abuse                                                        |

All CV requester fields are optional. **Download CV** with empty optional fields sends no identifying details.
The PDF contains only portfolio data and is downloaded directly, not emailed.

## Lawful basis

- **Contact messages:** legitimate interests (Article 6(1)(f)) in handling correspondence
  initiated by you. Required fields are necessary to send a message through this form.
- **Optional CV details:** consent (Article 6(1)(a)), through a separate, initially unchecked
  checkbox. Declining does not affect the download. Consent can be withdrawn by email without
  affecting the lawfulness of earlier processing.
- **Necessary security processing:** legitimate interests in keeping the site safe and available.

There is no required "accept privacy policy" checkbox. Reading a notice and consenting to a
particular purpose are different things.

## Retention

CV requester details and their consent record are retained for **six calendar months**.
Contact messages and anonymous download events are retained for **twelve calendar months**.
Daily UTC cleanup and startup catch-up remove expired rows; admin lists exclude them immediately
at the cutoff. Applicable earlier deletion or consent-withdrawal requests are handled manually.

Restricted disaster-recovery backups expire after **thirty days**. Deleted data may remain in
those backups until expiry, but is not used for other purposes. Expiry and earlier erasures must
be reapplied before a restored database is brought online. Minimal deletion identifiers are kept
outside database backups for **thirty-one days** to support that reconciliation.

Site-controlled security logs have a **thirty-day** rotation policy. Infrastructure providers
apply their own security-log policies. GDPR has no universal six- or twelve-month limit: these
periods must remain necessary for the stated purposes and should be reviewed.

## Your rights

Depending on the circumstances, you can request access, correction, deletion or restriction,
object to legitimate-interest processing, and request portability for consent-based processing
where applicable. You can withdraw CV logging consent. Email the privacy contact above; I may
request proportionate information to verify your identity. I normally respond within one month,
subject to legally permitted extensions.

You may complain to a supervisory authority, particularly where you live or work or where an
infringement occurred. The [EDPB directory](https://www.edpb.europa.eu/about-edpb/about-edpb/members_en)
lists these authorities.

## Data storage

Submissions are stored in a restricted PostgreSQL database. Oracle Cloud hosts the application;
Cloudflare provides network security, Turnstile bot verification and R2 object/backup storage.
These providers can process technical data. Turnstile tokens are verified transiently and not
stored with submissions. Infrastructure processing can involve locations outside the EEA;
contact the controller for the actual locations and applicable transfer safeguards.

See the [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/) and
[Oracle privacy policy](https://www.oracle.com/legal/privacy/).

## Required notice links

- Site-wide footer, regardless of feature flags: `/privacy`.
- Contact form, immediately before submission: short purpose/retention note and `/privacy` link.
- CV form, beside the optional consent checkbox and before downloading: `/privacy` link.
- The privacy route itself is never feature-gated and includes a direct privacy email address.

## Implementation and publication notes

The public English/Dutch page is implemented separately in the web app; keep its copy and this
document aligned. These notes are operational guidance, not public notice text or legal advice.

Before production publication, confirm the privacy mailbox works; verify actual provider
regions, contractual roles and any required transfer safeguards; audit analytics/edge settings;
run `bash deploy/configure-r2-retention.sh`; install `deploy/portfolio-logs.logrotate`; verify
effective lifecycle expiry and log retention; and complete a restore drill. Do not claim that
unverified provider arrangements or retention settings are already in place.

Contact legitimate-interest assessment: the purpose is responding to visitor-initiated
correspondence; name/email/message support handling and replying, optional organization provides
context, and no marketing reuse is permitted. Visitors reasonably expect a reply; access is
restricted, retention bounded, and objection/deletion available. Reassess if the purpose,
fields or recipients change. The twelve-month period supports professional conversations and
follow-up; reduce it if that window is not actually needed.
