var fs = require('fs');
const request = require('supertest');
const express = require('express');
const app = require('../app');

describe('General Stuff', function() {
	it('sets a cookie', function(done) {
		request(app)
			.get('/users')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect('set-cookie', /id=[0-9]+;/)
			.expect(200, done);
	});
});

describe('GET /users', function() {
	it('gets users', function(done) {
		request(app)
			.get('/users')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.expect(res => {
				const body = res.body;
				var user;

				for (var x=0; x<body.length; x++) {
					user = body[x];
					if (
						parseInt(user.id) <= 0 ||
						user.name === undefined ||
						user.avatar === undefined ||
						!(user.tags instanceof Array)
					) return false;
				}
				return true;
			})
			.end(function(err, res){
				done(err || undefined);
			});
	});
});

describe('GET /node/1', function() {
	it('gets node', function(done) {
		request(app)
			.get('/node/1')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.end((err, res) => {
				const { body: node } = res;

				if (
					parseInt(node.id)				>			0						&&
					node.text								!==		undefined		&&
					node.ratification				!==		undefined		&&
					node.creation						!==		undefined		&&
					node.handle							!==		undefined		&&
					node.children.length		===		2						&&
					parseInt(node.user_id)	>			0
				) {
					done();
				} else {
					done(new Error("Test failed: " + JSON.stringify(node)));
				};
			});
	});
});
