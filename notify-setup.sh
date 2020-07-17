#!/bin/bash
# !!! change directory to script location

file=notify.service
pwd=$(pwd)
username=$(logname)

if [ -e $file ]; then
  echo "Moving $file to $file.old"
  mv $file $file.old
fi
# creatting new notify.service file
  echo Creating new $file
  echo >> "notify.service"
  echo [Unit] > $file
  echo Description=server.js - backend for Notify service >> $file
  echo Documentation=http://localhost:3000 >> $file
  echo -e "After=network.target\n" >> $file
  echo [Service] >> $file
  echo Environment=NODE_PORT=3000 >> $file
  echo Type=simple >> $file
  echo User=$username >> $file
  echo ExecStart=/usr/bin/node $pwd/server.js >> $file
  echo -e "Restart=on-failure\n" >> $file
  echo [Install] >> $file
  echo WantedBy=multi-user.target >> $file

# # sudo apt update
# # check for Nodejs
# version=$(node -v)
# if [ $? ]; then
#     echo  "Nodejs version $version: OK"
# else
#    echo "Installing Node.js and npm..."
#    sudo apt install nodejs npm
# fi

# # check for MongoDb
# version=$(sudo /usr/bin/mongod --version) 
# status=$?

# if [ $status = "1" ]; then 
# 	echo "Installing MongoDb..."
# 	sudo apt install mongodb -y
# elif [ $status = "0" ]; then
# 	echo $version
# 	echo "MongoDb: OK" 
# fi

# # installing systemd service file
# if [ -f notify.service ]; then
# 	sudo cp notify.service /lib/systemd/system/
# 	echo Notify service added to systemd
# 	sudo systemctl daemon-reload
# 	sudo systemctl start notify
# 	echo Notify service started
# 	sudo systemctl enable notify
# 	echo Notify service autostart enabled
# else 
# 	echo "*** Systemd service is missing ***"
# 	exit 1
# fi

