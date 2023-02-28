ifneq (,$(wildcard ./.env))
    include .env
    export
endif

dev: export MOCK=1
dev: export DEBUG=1

.PHONY: dev
dev:
	make firefox

.PHONY: userscript
userscript:
	deno task watch:userscript

.PHONY: devuserscript
devuserscript:
	MOCK=1 DEBUG=1 make userscript

.PHONY: https-userscript
https-userscript:
	MOCK=1 DEBUG=1 LOCAL_HTTPS=1 make userscript

.PHONY: devsafari
devsafari:
	MOCK=1 DEBUG=1 SAFARI=1 make userscript

.PHONY: startuserscript
startuserscript:
	DEBUG=1 make userscript

.PHONY: debugkeepbc
debugkeepbc:
		web-ext run -s dist/firefox -f firefoxdeveloperedition  -p firefox-dev-profile --profile-create-if-missing --keep-profile-changes

.PHONY: debugkeeptool
debugkeeptool:
		web-ext run -s dist/firefox -f firefoxdeveloperedition -p firefox-dev-profile --profile-create-if-missing --keep-profile-changes --devtools

.PHONY: debugtool
debugtool:
		web-ext run -s dist/firefox -f firefoxdeveloperedition -p dev-edition-default --devtools
.PHONY: start
start:
	make firefox
.PHONY: check
check:
	deno check background.ts popup.tsx userscript.ts userscript/options_entry.ts options.tsx

.PHONY: test
test:
	make check && deno test --no-lock -A

.PHONY: devchrome
devchrome:
	MOCK=1 DEBUG=1 make chrome

.PHONY: startchrome
startchrome:
	make chrome

.PHONY: firefox
firefox:
	deno run --watch=buildin_config.json -A ./build.ts --watch --firefox	

.PHONY: chrome
chrome:
	deno task watch:chrome

.PHONY: build
build:
	deno task build && make zip

.PHONY: prod-build
prod-build:
	PROD=1 deno task build && make zip

.PHONY: prod-manual
prod-manual:
	RELEASE_ZIP=1 make prod-build

.PHONY: buildonly
buildonly:
	PROD=1 deno task build
.PHONY: zip
zip:
	cd ./dist/chrome/ && zip ../chrome.zip ./ -r -q -9 -x *.DS_Store && cd ../firefox && zip ../firefox.zip ./ -r -q -9 -x *.DS_Store

.PHONY: debugkeep
debugkeep:
	web-ext run -s dist/firefox -f firefoxdeveloperedition -p firefox-dev-profile --profile-create-if-missing --keep-profile-changes

.PHONY: debug
debug:
	web-ext run -s dist/firefox -f firefoxdeveloperedition -p dev-edition-default --firefox-preview
#--devtools

.PHONY: debugchrome
debugchrome:
	web-ext run -s dist/chrome -t chromium

.PHONY: serve
serve:
	deno run --watch=./serve.ts -A ./serve.ts	

.PHONY: clean
clean:
	rm -rf ./dist

.PHONY: generateconfig
generateconfig:
	deno run -A cli.ts --print-config > ${target}

.PHONY: mytarget
mytarget:
	MYVAR=foo
	echo $$MYVAR
	echo ${MYVAR}

.PHONY: movetopublic
movetopublic:
	make build
	cp dist/userscript/immersive-translate.user.js ../immersive-translate/docs/immersive-translate.user.js

.Phony: icon
icon:
	deno run -A ./scripts/generate_icon.ts

.Phony: movedist
movedist:
	./scripts/move_dist.sh


.Phony: copypdf
copypdf:
	cp -R ../pdf.js/build/generic/web/ ./onetime_static/pdf/ && cp -R ../pdf.js/build/generic/build/ ./onetime_static/build/ && mv ./onetime_static/pdf/viewer.html ./onetime_static/pdf/index.html

.Phony: pdf
pdf:
	cp ./assets/sample-pdf.pdf ../pdf.js/web/compressed.tracemonkey-pldi-09.pdf && cd ../pdf.js && gulp generic
	make copypdf

.Phony: samplepdf
samplepdf:
	cp ./assets/sample-pdf.pdf ./onetime_static/pdf/compressed.tracemonkey-pldi-09.pdf

.Phony: tpdf
tpdf:
	cp ./assets/test.pdf ./onetime_static/pdf/compressed.tracemonkey-pldi-09.pdf

.Phony: v
v:
	git tag -a v${v} -m "v${v}"
	git push --tags

.Phony: adb
adb:
	adb push ./dist/chrome.zip /sdcard/Documents/chrome.zip
	adb push ./dist/userscript/immersive-translate.user.js /sdcard/Documents/immersive-translate.user.js

.Phony: uploadtostay
uploadtostay:
	deno run -A ./scripts/upload_to_stayfork.ts

.Phony: zipsource
zipsource:
	git archive -o dist/immersive-translate-source.zip HEAD
