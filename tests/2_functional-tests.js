const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { test } = require('mocha');

chai.use(chaiHttp);

let tester_thread_id;
let tester_reply_id;

suite('Functional Tests', function() {
    this.timeout(5000);
    // Creating a new thread: POST request to /api/threads/{board}
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
        chai
            .request(server)
            .post('/api/threads/testerboard')
            .send({text: 'testertext', delete_password: 'pass'})
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.body.text, 'testertext');
                assert.equal(res.body.delete_password, 'pass');
                assert.equal(res.body.reported, false);
                tester_thread_id = res.body._id;
                done();
            })
    })
    // Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
        chai
            .request(server)
            .get('/api/threads/testerboard')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.exists(res.body[0]);
                assert.equal(res.body[0].text, 'testertext');
                done();
            })
    })
    // Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function (done) {
        chai
            .request(server)
            .delete('/api/threads/testerboard')
            .send({board: 'testerboard', thread_id: tester_thread_id, delete_password: 'notpass'})
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            })
    })
    // Reporting a thread: PUT request to /api/threads/{board} 
    test('Reporting a thread: PUT request to /api/threads/{board}', function (done) {
        chai
            .request(server)
            .put('/api/threads/testerboard')
            .send({board: 'testerboard', thread_id: tester_thread_id})
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            })
    })
    // Creating a new reply: POST request to /api/replies/{board}
    test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
        chai
            .request(server)
            .post('/api/replies/testerboard')
            .send({board: 'testerboard', thread_id: tester_thread_id, text: 'testreplytext', delete_password: 'replypass'})
            .end((err, res) => {
                tester_reply_id = res.body._id;
                assert.equal(res.status, 200);
                assert.equal(res.body.text, 'testreplytext');
                done();
            })
    })
    // Viewing a single thread with all replies: GET request to /api/replies/{board}
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function (done) {
        chai
            .request(server)
            .get('/api/replies/testerboard?thread_id=' + tester_thread_id)
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.body.replies[0].text, 'testreplytext');
                done();
            })
    })
    // Reporting a reply: PUT request to /api/replies/{board}
    test('Reporting a reply: PUT request to /api/replies/testerboard', function (done) {
        chai
            .request(server)
            .put('/api/replies/testerboard')
            .send({board: 'testerboard', thread_id: tester_thread_id, reply_id: tester_reply_id})
            .end((err, res) => {
                console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            })
    })
    // Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function (done) {
        chai
            .request(server)
            .delete('/api/replies/testerboard')
            .send({board: 'testerboard', thread_id: tester_thread_id, reply_id: tester_reply_id, delete_password: 'notpass'})
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            })
    })
    // Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function (done) {
        chai
            .request(server)
            .delete('/api/replies/testerboard')
            .send({board: 'testerboard', thread_id: tester_thread_id, reply_id: tester_reply_id, delete_password: 'replypass'})
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            })
    })
    // Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function (done) {
        chai
            .request(server)
            .delete('/api/threads/testerboard')
            .send({board: 'testerboard', thread_id: tester_thread_id, delete_password: 'pass'})
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done()
            })
    })
});
