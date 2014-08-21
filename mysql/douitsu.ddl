CREATE TABLE IF NOT EXISTS sys_entity (
  id varchar(255) NOT NULL,
  zone varchar(255) DEFAULT NULL,
  base varchar(255) DEFAULT NULL,
  name varchar(255) DEFAULT NULL,
  fields varchar(4000) DEFAULT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS sys_settings (
  id varchar(255) NOT NULL,
  kind varchar(255) DEFAULT NULL,
  spec varchar(255) DEFAULT NULL,
  ref varchar(255) DEFAULT NULL,
  settings varchar(255) DEFAULT NULL,
  data varchar(4000) DEFAULT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS sys_user (
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
  accounts varchar(4000) DEFAULT NULL,
  seneca varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS sys_login (
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

CREATE TABLE IF NOT EXISTS sys_account (
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

CREATE TABLE IF NOT EXISTS application (
  id varchar(255) NOT NULL,
  account varchar(255) DEFAULT NULL,
  name varchar(255) DEFAULT NULL,
  appid varchar(255) DEFAULT NULL,
  secret varchar(255) DEFAULT NULL,
  homeurl varchar(255) DEFAULT NULL,
  callback varchar(255) DEFAULT NULL,
  `desc` varchar(255) DEFAULT NULL,
  image varchar(255) DEFAULT NULL,
  active tinyint(1) DEFAULT NULL,
  is_ninja_official tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS authcode (
  id varchar(255) NOT NULL,
  code varchar(255) NOT NULL,
  clientID varchar(255) NOT NULL,
  redirectURI varchar(255) NOT NULL,
  userID varchar(255) NOT NULL,
  scope varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS accesstoken (
  id varchar(255) NOT NULL,
  userID varchar(255) NOT NULL,
  clientID varchar(255) NOT NULL,
  clientName varchar(255) NOT NULL,
  type varchar(255) NOT NULL DEFAULT 'application',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS accesstoken_scope (
  id varchar(255) NOT NULL,
  accesstoken varchar(255) NOT NULL,
  scope_domain varchar(255) NOT NULL,
  scope_item varchar(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `scope_specific` (accesstoken, scope_domain, scope_item),
  FOREIGN KEY (accesstoken) REFERENCES accesstoken (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- add support for different types of access tokens
--   ALTER TABLE accesstoken ADD COLUMN type varchar(255) NOT NULL DEFAULT 'application';

-- add support for passing through the scope parameter from the initial request
--   ALTER TABLE authcode ADD COLUMN scope varchar(255) NOT NULL DEFAULT '';

-- add support for "official" applications that don't require prompting for auth
--   ALTER TABLE application ADD COLUMN is_ninja_official tinyint(1) NOT NULL DEFAULT 0;

-- add support for the unique and small mqtt_client_id that mqtt-proxy will use for node tokens - Theo, 12 Aug 2014
--   ALTER TABLE accesstoken ADD COLUMN `mqtt_client_id` int(20) NOT NULL AUTO_INCREMENT UNIQUE;
--   ALTER TABLE accesstoken ADD COLUMN `node_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NULL DEFAULT NULL;


-- for migrating from activation service tokens to douitsu node tokens:
--   insert into accesstoken (id,userID,clientID,clientName,type,node_id) select nn.token, nn.user_id, '', '', 'node', nn.node_id from ninja.nodes nn;
--   insert into accesstoken_scope (id, accesstoken, scope_domain, scope_item) select concat('scope_', sha1(concat('api_', at.id))), at.id, 'api', '*' from accesstoken at where at.type='node';
--   insert into accesstoken_scope (id, accesstoken, scope_domain, scope_item) select concat('scope_', sha1(concat('mqtt_', at.id))), at.id, 'mqtt', '*' from accesstoken at where at.type='node';


