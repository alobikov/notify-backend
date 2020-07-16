# sudo apt update
# check for Nodejs
version=$(node -v)
if [ $? ]; then
    echo  "Nodejs version $version: OK"
else
   echo "Installing Node.js and npm..."
   sudo apt install nodejs npm
fi

# check for MongoDb
version=$(sudo /usr/bin/mongod --version) 
status=$?

if [ $status = "1" ]; then 
	echo "Installing MongoDb..."
	sudo apt install mongodb -y
elif [ $status = "0" ]; then
	echo $version
	echo "MongoDb: OK" 
fi

# installing systemd service file
if [ -f notify.service ]; then
	sudo cp notify.service /lib/systemd/system/
	echo Notify service added to systemd
	sudo systemctl daemon-reload
	sudo systemctl start notify
	echo Notify service started
	sudo systemctl enable notify
	echo Notify service autostart enabled
else 
	echo "*** Systemd service is missing ***"
	exit 1
fi

