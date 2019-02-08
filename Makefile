.PHONY: clean \
	compile \
	package
clean:
	rm -rf ./dist
	rm -f lambda.zip

compile:
	# Disable --noUnusedLocals when to work around code generated from schemas
	npm run compile -- --noUnusedLocals false

package: clean compile
	cp package.json package-lock.json dist/ && \
		cd ./dist && \
		npm install --production && \
		zip -qr lambda-$(shell git rev-parse --short HEAD).zip . *

