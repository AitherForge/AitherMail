# AitherMail personal mailbox architecture

AitherMail is designed to use the Google account the user explicitly connects, rather than a shared sender account. Google OAuth is used for mailbox access; Aither Account remains the identity used across Aither apps. OAuth access should stay in memory in the browser unless a secure backend token store is implemented. Never put Google client secrets or refresh tokens in frontend code.
