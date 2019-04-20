-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema da3002-test
-- -----------------------------------------------------
-- utf8mb4 allows emoji
DROP SCHEMA IF EXISTS `da3002-test` ;

-- -----------------------------------------------------
-- Schema da3002-test
--
-- utf8mb4 allows emoji
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `da3002-test` DEFAULT CHARACTER SET utf8mb4 ;
USE `da3002-test` ;

-- -----------------------------------------------------
-- Table `da3002-test`.`User`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `da3002-test`.`User` ;

CREATE TABLE IF NOT EXISTS `da3002-test`.`User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  `avatar` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `da3002-test`.`Privacy`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `da3002-test`.`Privacy` ;

CREATE TABLE IF NOT EXISTS `da3002-test`.`Privacy` (
  `id` INT NOT NULL DEFAULT 0,
  `name` VARCHAR(45) NULL,
  `value` INT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `da3002-test`.`Relationship`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `da3002-test`.`Relationship` ;

CREATE TABLE IF NOT EXISTS `da3002-test`.`Relationship` (
  `user_id` INT NOT NULL,
  `relationship_id` INT NOT NULL,
  `privacy_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `relationship_id`),
  CONSTRAINT `fk_UserRelationship_User1`
    FOREIGN KEY (`user_id`)
    REFERENCES `da3002-test`.`User` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_UserRelationship_User2`
    FOREIGN KEY (`relationship_id`)
    REFERENCES `da3002-test`.`User` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_UserRelationship_PrivacyLevel1`
    FOREIGN KEY (`privacy_id`)
    REFERENCES `da3002-test`.`Privacy` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `da3002-test`.`Node`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `da3002-test`.`Node` ;

CREATE TABLE IF NOT EXISTS `da3002-test`.`Node` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `text` VARCHAR(5000) NULL,
  `user_id` INT NOT NULL,
  `ratification` DATETIME NULL,
  `creation` DATETIME NULL,
  `handle` VARCHAR(45) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_Nodes_User1`
    FOREIGN KEY (`user_id`)
    REFERENCES `da3002-test`.`User` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `da3002-test`.`Junction`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `da3002-test`.`Junction` ;

CREATE TABLE IF NOT EXISTS `da3002-test`.`Junction` (
  `node_id` INT NOT NULL,
  `child_node_id` INT NOT NULL,
  CONSTRAINT `fk_Junction_Nodes1`
    FOREIGN KEY (`node_id`)
    REFERENCES `da3002-test`.`Node` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Junction_Nodes2`
    FOREIGN KEY (`child_node_id`)
    REFERENCES `da3002-test`.`Node` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `da3002-test`.`Type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `da3002-test`.`Type` ;

CREATE TABLE IF NOT EXISTS `da3002-test`.`Type` (
  `id` INT NOT NULL,
  `name` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `da3002-test`.`User_Node`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `da3002-test`.`User_Node` ;

CREATE TABLE IF NOT EXISTS `da3002-test`.`User_Node` (
  `user_id` INT NOT NULL,
  `node_id` INT NOT NULL,
  `privacy_id` INT NOT NULL,
  `type_id` INT NOT NULL,
  CONSTRAINT `fk_User_Node_User1`
    FOREIGN KEY (`user_id`)
    REFERENCES `da3002-test`.`User` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_User_Node_Nodes1`
    FOREIGN KEY (`node_id`)
    REFERENCES `da3002-test`.`Node` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_User_Node_PrivacyLevel1`
    FOREIGN KEY (`privacy_id`)
    REFERENCES `da3002-test`.`Privacy` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_User_Node_Type1`
    FOREIGN KEY (`type_id`)
    REFERENCES `da3002-test`.`Type` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `da3002-test`.`Privacy`
-- -----------------------------------------------------
START TRANSACTION;
USE `da3002-test`;
INSERT INTO `da3002-test`.`Privacy` (`id`, `name`, `value`) VALUES (1, 'Private', 0);
INSERT INTO `da3002-test`.`Privacy` (`id`, `name`, `value`) VALUES (2, 'Close', 1);
INSERT INTO `da3002-test`.`Privacy` (`id`, `name`, `value`) VALUES (3, 'Near', 2);
INSERT INTO `da3002-test`.`Privacy` (`id`, `name`, `value`) VALUES (4, 'Far', 3);
INSERT INTO `da3002-test`.`Privacy` (`id`, `name`, `value`) VALUES (5, 'Public', 4);

COMMIT;


-- -----------------------------------------------------
-- Data for table `da3002-test`.`Type`
-- -----------------------------------------------------
START TRANSACTION;
USE `da3002-test`;
INSERT INTO `da3002-test`.`Type` (`id`, `name`) VALUES (0, 'Null');
INSERT INTO `da3002-test`.`Type` (`id`, `name`) VALUES (1, 'Visit');
INSERT INTO `da3002-test`.`Type` (`id`, `name`) VALUES (2, 'Sarcastic');
INSERT INTO `da3002-test`.`Type` (`id`, `name`) VALUES (3, 'Joking');
INSERT INTO `da3002-test`.`Type` (`id`, `name`) VALUES (4, 'Serious');

COMMIT;

