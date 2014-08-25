// Generated by CoffeeScript 1.7.1
var checkOptions, cliff, configFilePath, fs, getGitlabDataTypeMap, getTableHeadByData, gitlab, gitlabDircPath, makeTableByData, makeTableByIssue, makeTableByProject, makeTableByUser, nconf, path, requireOrGetGitlab, tableHeadType;

nconf = require("nconf");

fs = require("fs");

path = require("path");

cliff = require("cliff");

gitlabDircPath = path.join(process.env[(process.platform === "win32" ? "USERPROFILE" : "HOME")], ".gitlab");

if (!fs.existsSync(gitlabDircPath)) {
  fs.mkdirSync(gitlabDircPath);
}

configFilePath = path.join(gitlabDircPath, "config.json");

nconf.file({
  file: configFilePath
});

nconf.defaults({
  "table_head_user": JSON.stringify(["id", "name", "username", "state", "email", "created_at"]),
  "table_head_project": JSON.stringify(["id", "name", "public", "archived", "visibility_level", "issues_enabled", "wiki_enabled", "created_at", "last_activity_at"]),
  "table_head_issue": JSON.stringify(["id", "iid", "project_id", "title", "description", "state", "created_at", "updated_at", "labels", "assignee", "author"]),
  "table_head_commite": JSON.stringify(["id", "title", "author_name", "created_at"])
});

gitlab = null;

tableHeadType = ["user", "project", "issue", "commite"];

checkOptions = function() {
  if (!nconf.get("url")) {
    console.log("You should set url by 'gitlab --url http://example.com' ");
    return false;
  }
  if (!nconf.get("token")) {
    console.log("You should set token by 'gitlab --token abcdefghij123456' ");
    return false;
  }
  return true;
};

makeTableByData = function(datas, table_head) {
  var data, key, row, rows, value, _i, _j, _len, _len1;
  if (datas.constructor === Array && !datas.length) {
    return console.log("No Datas Or No Permission");
  } else if (datas.constructor !== Array) {
    datas = [datas];
  }
  if (table_head == null) {
    table_head = getTableHeadByData(datas[0]);
  }
  rows = [table_head];
  for (_i = 0, _len = datas.length; _i < _len; _i++) {
    data = datas[_i];
    row = [];
    rows.push(row);
    for (_j = 0, _len1 = table_head.length; _j < _len1; _j++) {
      key = table_head[_j];
      value = data[key];
      if ((value != null) && typeof value === "object") {
        value = value.name || value.id;
      }
      row.push(value || "");
    }
  }
  return console.log(cliff.stringifyRows(rows));
};

makeTableByUser = function(data) {
  return makeTableByData(data, JSON.parse(nconf.get("table_head_user")));
};

makeTableByProject = function(data) {
  return makeTableByData(data, JSON.parse(nconf.get("table_head_project")));
};

makeTableByIssue = function(data) {
  return makeTableByData(data, JSON.parse(nconf.get("table_head_issue")));
};

getTableHeadByData = function(data) {
  var key, table_head, _i, _len;
  table_head = [];
  if ((data != null) && data.constructor === Array) {
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      key = data[_i];
      if (key !== "id") {
        table_head.push(key);
      } else {
        table_head.unshift(key);
      }
    }
  } else {
    for (key in data) {
      if (key !== "id") {
        table_head.push(key);
      } else {
        table_head.unshift(key);
      }
    }
  }
  return table_head;
};

requireOrGetGitlab = function() {
  if (gitlab != null) {
    return gitlab;
  } else {
    if (checkOptions()) {
      gitlab = require("gitlab")({
        url: nconf.get("url"),
        token: nconf.get("token")
      });
      return gitlab;
    }
  }
};

getGitlabDataTypeMap = function(type) {
  var map;
  if (type == null) {
    type = "user";
  }
  gitlab = requireOrGetGitlab();
  map = {
    "user": gitlab.users.current,
    "project": function(callback) {
      return gitlab.projects.all(function(projects) {
        return callback(projects[0]);
      });
    },
    "issue": function(callback) {
      return gitlab.issues.all(function(issues) {
        return callback(issues[0]);
      });
    }
  };
  return map[type] || map["user"];
};

exports.users = {
  all: function() {
    return requireOrGetGitlab().users.all(function(users) {
      users.sort(function(user1, user2) {
        return parseInt(user1.id) - parseInt(user2.id);
      });
      return makeTableByUser(users);
    });
  },
  current: function() {
    return requireOrGetGitlab().users.current(makeTableByUser);
  },
  show: function(userId) {
    return requireOrGetGitlab().users.show(userId, makeTableByUser);
  }
};

exports.projects = {
  all: function() {
    return requireOrGetGitlab().projects.all(function(projects) {
      projects.sort(function(project1, project2) {
        return parseInt(project1.id) - parseInt(project2.id);
      });
      return makeTableByProject(projects);
    });
  },
  show: function(userId) {
    return requireOrGetGitlab().projects.show(userId, makeTableByProject);
  },
  members: {
    list: function(projectId) {
      return requireOrGetGitlab().projects.members.list(projectId, makeTableByUser);
    }
  },
  repository: {
    branches: function(projectId) {
      return requireOrGetGitlab().projects.repository.listBranches(projectId, makeTableByData);
    },
    commits: function(projectId) {
      return requireOrGetGitlab().projects.repository.listCommits(projectId, function(commits) {
        return makeTableByData(commits, JSON.parse(nconf.get("table_head_user")));
      });
    },
    tags: function(projectId) {
      return requireOrGetGitlab().projects.repository.listTags(projectId, makeTableByData);
    },
    tree: function(projectId) {
      return requireOrGetGitlab().projects.repository.listTree(projectId, makeTableByData);
    }
  }
};

exports.issues = {
  all: function() {
    return requireOrGetGitlab().issues.all(function(issues) {
      issues.sort(function(issue1, issue2) {
        return parseInt(issue1.id) - parseInt(issue2.id);
      });
      return makeTableByIssue(issues);
    });
  }
};

exports.tableHead = {
  checkTableHead: function(table_head) {
    var index, key, temp, _i, _j, _len, _len1;
    if (!((table_head != null) || table_head.constructor === Array || table_head.length)) {
      return;
    }
    for (index = _i = 0, _len = table_head.length; _i < _len; index = ++_i) {
      key = table_head[index];
      table_head[index] = (key + "").trim();
    }
    for (index = _j = 0, _len1 = table_head.length; _j < _len1; index = ++_j) {
      key = table_head[index];
      if (key === "id") {
        temp = table_head[0];
        table_head[0] = table_head[index];
        table_head[index] = temp;
        return table_head;
      }
    }
    table_head[0] = "id";
    return table_head;
  },
  set: function(type, table_head) {
    table_head = this.checkTableHead(table_head);
    if (table_head != null) {
      nconf.set("table_head_" + type, JSON.stringify(table_head));
      nconf.save();
      return console.log("Save " + type + " table head");
    } else {
      return console.log("Can not save " + type + " table head, please check it");
    }
  },
  get: function(type) {
    var table_head;
    table_head = nconf.get("table_head_" + type);
    if (table_head != null) {
      return console.log(JSON.parse(table_head));
    } else {
      return console.log("Can not find " + type + " table head");
    }
  },
  add: function(type, column) {
    var table_head;
    table_head = nconf.get("table_head_" + type);
    if (table_head != null) {
      table_head = JSON.parse(table_head);
      if (table_head.indexOf(column) < 0) {
        table_head.push(column);
        return this.set(type, table_head);
      }
    }
  },
  remove: function(type, column) {
    var index, table_head;
    table_head = nconf.get("table_head_" + type);
    if (table_head != null) {
      table_head = JSON.parse(table_head);
      index = table_head.indexOf(column);
      if (index > -1) {
        table_head.splice(index, 1);
        return this.set(type, table_head);
      }
    }
  },
  reset: function(type) {
    var _base;
    return typeof (_base = getGitlabDataTypeMap(type)) === "function" ? _base(function(data) {
      if (data != null) {
        return exports.tableHead.set(type, getTableHeadByData(data));
      }
    }) : void 0;
  },
  getType: function() {
    return console.log("type of table head:", tableHeadType);
  },
  getOrigin: function(type) {
    var fn;
    fn = getGitlabDataTypeMap(type);
    if (fn != null) {
      return fn(function(data) {
        if (data == null) {
          return console.log("Can not get this type data");
        }
        return console.log(getTableHeadByData(data));
      });
    } else {
      return console.log("Error type:%j", type);
    }
  }
};

exports.url = function(url) {
  if (url != null) {
    nconf.set("url", url);
    nconf.save();
    return console.log("Save url");
  } else {
    return console.log(nconf.get("url"));
  }
};

exports.token = function(token) {
  if (token != null) {
    nconf.set("token", token);
    nconf.save();
    return console.log("Save token");
  } else {
    return console.log(nconf.get("token"));
  }
};

exports.getOption = function() {
  var key, opitons, value, _results;
  opitons = nconf.get();
  _results = [];
  for (key in opitons) {
    value = opitons[key];
    _results.push(console.log("" + key + ":" + value));
  }
  return _results;
};
