'use strict';
const text = require('body-parser/lib/types/text');
// added subsequently
const mongoose = require('mongoose');
// added subsequently
const { Schema } = mongoose;

const db = mongoose.connect(process.env.DB);

const replySchema = new Schema({
  text: {type: String},
  delete_password: {type: String},
  created_on: {type: Date, default: new Date()},
  bumped_on: {type: Date, default: new Date()},
  reported: {type: Boolean, default: false}
})
const Reply = mongoose.model('Reply', replySchema);

const threadSchema = new Schema({
  text: {type: String},
  delete_password: {type: String},
  reported: {type: Boolean, default: false},
  created_on: {type: Date, default: new Date()},
  bumped_on: {type: Date, default: new Date()},
  replies: {type: [replySchema]}
})
const Thread = mongoose.model('Thread', threadSchema);

const boardSchema = new Schema({
  name: {type: String},
  threads: {type: [threadSchema]}
})
const Board = mongoose.model('Board', boardSchema);

module.exports = function (app) {  
  app.route('/api/threads/:board')
    .get((req, res) => {
      let board = req.params.board;
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          console.log("error finding board in get 1");
        } else if (!docs) {
          console.log("no docs in get 2, sent empty array");
          return res.send("we apologize, this board does not exist");
        } else {
          if (docs.threads) {
            docs.threads.sort((a, b) => (new Date(a.bumped_on).getTime() > new Date(b.bumped_on).getTime()) ? -1 : 1).map((element) => {
              return {text: element.text, created_on: element.created_on, bumped_on: element.bumped_on}
            })
            for (let i = 0; i < docs.threads.length; i++) {
              if (docs.threads[i].replies) {
                if (docs.threads[i].replies.length > 1) {
                  docs.threads[i].replies.sort((a, b) => (new Date(a.bumped_on) > new Date(b.bumped_on)) ? 1 : -1);
                }
              }
            }
            let result = docs.threads.slice(0, 10);
            for (let j = 0; j < result.length; j++) {
              if (result[j].replies) {
                result[j].replies = result[j].replies.slice(0, 3);
                result[j].replies = result[j].replies.map(reply => {
                  return {text: reply.text, created_on: reply.created_on, bumped_on: reply.bumped_on};
                })
              }
            }
            res.json(result);
          } else {
            res.json(docs);
          }
        }
      })
    })
    .post((req, res) => {
      let board = req.body.board;
      if (!board) {
        board = req.params.board;
      }
      let text = req.body.text;
      let delete_password = req.body.delete_password;
      const newThread = new Thread({
        text,
        board,
        delete_password,
        replies: [],
        created_on: new Date(),
        bumped_on: new Date()
      });
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          res.json({error: "error finding board in post"});
        } else if (!docs) {
          const newBoard = new Board({
            name: board,
            threads: []
          });
          newBoard.threads.push(newThread);
          newBoard.save((err, docs) => {
            if (err || !docs) {
              console.log("error saving in post 1");
            } else {
              res.json(newThread);
            }
          });
        } else {
          docs.threads.push(newThread);
          docs.save((err, data) => {
            if (err || !data) {
              console.log("error saving in post 2");
            } else {
              res.json(newThread);
            }
          });
        }
      })
    })
    .put((req, res) => {
      let board = req.body.board;
      if (!board) {
        board = req.params.body;
      }
      let thread_id = req.body.thread_id;
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          console.log("error finding board in put thread");
        } else if (!docs) {
          console.log("no board found by this name");
          res.send("no board found by this name");
        } else if (!docs.threads) {
          console.log("board has no threads");
          res.send("board has no threads");
        } else {
          for (let i = 0; i < docs.threads.length; i++) {
            if (docs.threads[i]['_id'] == thread_id) {
              console.log("found thread by id put");
              docs.threads[i].reported = true;
              docs.save((err, docs) => {
                if (err) {
                  console.log("error saving reported thread");
                  return res.send("error");
                } else {
                  return res.send("success");
                }
              })
              break;
            }
          }
        }
      });
    })
    .delete((req, res) => {
      let board = req.body.board;
      let thread_id = req.body.thread_id;
      let delete_password = req.body.delete_password;
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          console.log("error finding board in put thread");
        } else if (!docs) {
          console.log("no board found by this name");
          res.send("no board found by this name");
        } else if (!docs.threads) {
          console.log("board has no threads");
          res.send("board has no threads");
        } else {
          for (let i = 0; i < docs.threads.length; i++) {
            if (docs.threads[i]['_id'] == thread_id) {
              console.log("found thread by id delete");
              if (docs.threads[i].delete_password == delete_password) {
                console.log("successfully deleted thread");
                console.log(docs.threads[i].delete_password);
                console.log(delete_password);
                docs.threads.splice(i, 1);
                docs.save((err, docs) => {
                  if (err) {
                    console.log("error saving reported thread");
                  } else {
                    return res.send("success");
                  }
                })
              } else {
                console.log("incorrect password");
                console.log(docs.threads[i].delete_password);
                console.log(delete_password);
                return res.send("incorrect password");
              }
              break;
            }
          }
        }
      });
    })
    
  app.route('/api/replies/:board')
    .get((req, res) => {
      let board = req.params.board;
      let thread_id = req.query.thread_id;
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          console.log("error finding board in get reply");
        } else if (!docs) {
          console.log("no such board: get reply");
          res.send("we apologize, no such board exists");
        } else if (!docs.threads) {
          console.log("board has no threads");
          res.send("we apologize, this board has no threads");
        } else {
          let thread;
          for (let i = 0; i < docs.threads.length; i++) {
            if (docs.threads[i]['_id'] == thread_id) {
              thread = docs.threads[i];
              break;
            }
          }
          if (!thread) {
            console.log("no thread by this id");
            res.send("could not find thread with this id");
          } else {
            thread.replies = thread.replies.map(reply => {
              return {text: reply.text, created_on: reply.created_on, bumped_on: reply.bumped_on}
            })
            res.send(thread);
          }
        }
      })
    })
    .post((req, res) => {
      let board = req.body.board;
      if (!board) {
        board = req.params.board;
      }
      let thread_id = req.body.thread_id;
      let text = req.body.text;
      let delete_password = req.body.delete_password;
      const newReply = new Reply({
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date()
      });
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          console.log("error finding board in post reply 1");
        } else if (!docs) {
          console.log("!docs 2");
        } else {
          for (let i = 0; i < docs.threads.length; i++) {
            if (docs.threads[i]['_id'] == thread_id) {
              console.log("changing bumpedon date post reply");
              docs.threads[i].bumped_on = new Date();
              docs.threads[i].replies.push(newReply);
              break;
            }
          }
          docs.save((err, docs) => {
            if (err) {
              console.log("error saving board in post replies");
            }
            res.send(newReply);
          })
        }
      });
    })
    .put((req, res) => {
      let board = req.body.board;
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          console.log("error finding board in put reply");
        } else if (!docs) {
          console.log("no board available by this name");
        } else if (!docs.threads) {
          console.log("no threads for this board");
        } else {
          for (let i = 0; i < docs.threads.length; i++) {
            if (docs.threads[i]._id == thread_id) {
              for (let j = 0; j < docs.threads[i].replies.length; j++) {
                if (docs.threads[i].replies[j]._id == reply_id) {
                  docs.threads[i].replies[j].reported = true;
                  docs.save((err, docs) => {
                    if (err) {
                      console.log("err saving reported reply")
                    } else {
                      return res.send("success");
                    }
                  })
                  break;
                }
              }
              break;
            }
          }
        }
      });
    })
    .delete((req, res) => {
      let board = req.body.board;
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let delete_password = req.body.delete_password;
      Board.findOne({name: board}, (err, docs) => {
        if (err) {
          console.log("error finding board in put reply");
        } else if (!docs) {
          console.log("no board available by this name");
        } else if (!docs.threads) {
          console.log("no threads for this board");
        } else {
          for (let i = 0; i < docs.threads.length; i++) {
            if (docs.threads[i]._id == thread_id) {
              for (let j = 0; j < docs.threads[i].replies.length; j++) {
                if (docs.threads[i].replies[j]._id == reply_id) {
                  if (docs.threads[i].replies[j].delete_password == delete_password) {
                    docs.threads[i].replies[j].text = "[deleted]";
                    docs.save((err, docs) => {
                      if (err) {
                        console.log("err")
                      } else {
                        return res.send("success");
                      }
                    })
                  } else {
                    return res.send("incorrect password")
                  }
                  break;
                }
              }
              break;
            }
          }
        }
      });
    })
};
