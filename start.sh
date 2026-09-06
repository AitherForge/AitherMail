#!/bin/sh
set -eu
MailHog -api-bind-addr 0.0.0.0:8025 -ui-bind-addr 0.0.0.0:8025 -smtp-bind-addr 0.0.0.0:1025 &
exec /aithermail
