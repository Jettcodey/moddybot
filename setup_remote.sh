#!/usr/bin/expect

set timeout 300
set host "162.192.96.49"
set user "cole"
set password "1532"
set repo_url "https://github.com/coah80/moddybot.git"

set env_content "TOKEN=MTQ2ODY3MDYzNTEyODEwMjkyMw.GMpcR4.W-RYRG-rrKbdqbO0ycxKL61lwKyyj4bPi_O28\\nWELCOME_CHANNEL_ID=1344561078440296479\\nCREATE_THREAD_ID=1344699091959156787\\nTHREAD_CREATION_ALERT_ID=1363227511722479657\\nMINIMUM_ROLE_REQUIRED=1344719236517466132\\nGUILD_ID=1344557689979670578\\nCLIENT_ID=1468670235128102923\\nALERT_CHANNEL_ID=1344576254447321169"

spawn ssh $user@$host

expect {
  "yes/no" {
    send "yes\r"
    exp_continue
  }
  "password:" {
    send "$password\r"
  }
}

expect "$ "

send "curl -fsSL https://bun.sh/install | bash\r"
expect "$ "

send "export BUN_INSTALL=\"\$HOME/.bun\"\r"
expect "$ "
send "export PATH=\"\$BUN_INSTALL/bin:\$PATH\"\r"
expect "$ "

send "bun install -g pm2\r"
expect "$ "

send "if \[ ! -d \"moddybot\" \]; then git clone $repo_url; fi\r"
expect "$ "

send "cd moddybot\r"
expect "$ "

send "echo \"$env_content\" > .env\r"
expect "$ "

send "bun install\r"
expect "$ "

send "pm2 start ecosystem.config.cjs\r"
expect "$ "

send "pm2 save\r"
expect "$ "

puts "\nSetup Complete!\n"
exit
