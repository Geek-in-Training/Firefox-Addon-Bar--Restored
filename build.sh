cd files/
zip -r -FS ../addonBar.xpi *
wget --post-file=../addonBar.xpi http://localhost:8880/
