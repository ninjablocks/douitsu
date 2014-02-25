CREATE TABLE sys_entity (
  id varchar(255) NOT NULL,
  zone varchar(255) DEFAULT NULL,
  base varchar(255) DEFAULT NULL,
  name varchar(255) DEFAULT NULL,
  fields varchar(4000) DEFAULT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE sys_settings (
  id varchar(255) NOT NULL,
  kind varchar(255) DEFAULT NULL,
  spec varchar(255) DEFAULT NULL,
  ref varchar(255) DEFAULT NULL,
  settings varchar(255) DEFAULT NULL,
  data varchar(4000) DEFAULT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE sys_user (
  id varchar(255) NOT NULL,
  nick varchar(255) DEFAULT NULL,
  name varchar(255) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  active tinyint(1) DEFAULT NULL,
  created datetime DEFAULT NULL,
  updated datetime DEFAULT NULL,
  confirmed tinyint(1) DEFAULT NULL,
  confirmcode varchar(255) DEFAULT NULL,
  admin tinyint(1) DEFAULT NULL,
  salt varchar(255) DEFAULT NULL,
  pass varchar(255) DEFAULT NULL,
  image varchar(255) DEFAULT NULL,
  gravatar varchar(255) DEFAULT NULL,
  accounts varchar(4000) DEFAULT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE sys_login (
  id varchar(255) NOT NULL,
  nick varchar(255) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  user varchar(255) DEFAULT NULL,
  active tinyint(1) DEFAULT NULL,
  auto tinyint(1) DEFAULT NULL,
  `when` datetime DEFAULT NULL,
  why varchar(255) DEFAULT NULL,
  token varchar(255) DEFAULT NULL,
  context varchar(255) DEFAULT NULL,
  ended timestamp NOT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE sys_account (
  id varchar(255) NOT NULL,
  name varchar(255) DEFAULT NULL,
  orignick varchar(255) DEFAULT NULL,
  origuser varchar(255) DEFAULT NULL,
  active tinyint(1) DEFAULT NULL,
  users varchar(4000) DEFAULT NULL,
  projects varchar(4000) DEFAULT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE sys_project (
  id varchar(255) NOT NULL,
  kind varchar(255) DEFAULT NULL,
  account varchar(255) DEFAULT NULL,
  name varchar(255) DEFAULT NULL,
  appid varchar(255) DEFAULT NULL,
  secret varchar(255) DEFAULT NULL,
  homeurl varchar(255) DEFAULT NULL,
  callback varchar(255) DEFAULT NULL,
  `desc` varchar(255) DEFAULT NULL,
  image varchar(255) DEFAULT NULL,
  active tinyint(1) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE authcode (
  id varchar(255) NOT NULL,
  code varchar(255) NOT NULL,
  clientID varchar(255) NOT NULL,
  redirectURI varchar(255) NOT NULL,
  userID varchar(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE accesstoken (
  id varchar(255) NOT NULL,
  userID varchar(255) NOT NULL,
  clientID varchar(255) NOT NULL,
  clientName varchar(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


