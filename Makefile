REPORTER = spec

lint:
	./node_modules/jshint/bin/jshint

test:
	$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER) --check-leaks

test-cov:
	$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha -- -R $(REPORTER) --check-leaks

test-coveralls:
	$(MAKE) test
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec --check-leaks
	cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js || :  # don't fail if coveralls.io is down

.PHONY: test
