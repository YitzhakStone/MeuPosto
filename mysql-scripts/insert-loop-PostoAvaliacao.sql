drop procedure if exists loop_temp;
delimiter ;;
create procedure loop_temp()
begin
	DECLARE v1 INT DEFAULT 1;
	WHILE v1 <= 20 DO
		insert into PostoAvaliacao (idposto, idusuario, avaliacao) values
		(171, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(199, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(219, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(238, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(279, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(281, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(369, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(401, 	v1, (select CEILING( rand() * 5 ) + 1)),
		(416, 	v1, (select CEILING( rand() * 5 ) + 1));
		SET v1 = v1 + 1;
	END WHILE;
end
;;
call loop_temp();;
update PostoAvaliacao set Avaliacao = 5 where Avaliacao = 6;;
drop procedure if exists loop_temp;;