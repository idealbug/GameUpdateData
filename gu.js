var activePage = true;
var timeoutRequest = 560;
/*
	Порт лаунчера
*/
var launcherPort = 12542;

/*
	Статус лаунчера
	В процессе работы лаунчера, статус будет меняться и принимать значения ниже.
	0 - Ничего не происходит
	1 - Идет обновление патча
	2 - Идет обновление клиента
	3 - Пауза обновления патча
	4 - Пауза обновления клиента
	5 - Обновление патча завершено (ничего не происходит)
	6 - Обновление клиента завершено (ничего не происходит)
	7 - Произошла ошибка
	8 - Проверка соответствия файлов
	9 - Загрузка отменена
 */
 
var Status = 0;
//Последнее сообщения события
var LastMsg = "";
//Кол-во файлов которые необходимо обновить
var CountFiles = -1;
//Кол-во обновленных файлов
var CountFilesUploaded = -1;
//Общий размер файлов в виде строки с отображением величины размера (KB/MB/GB...)
var FullSizeFileStr = "";
//Общий вес файлов (в байтах) которые необходимо скачать
var FullSizeFiles = -1;
//Сколько скачено (в байтах)
var SizeFilesUploaded = -1;
//Сколько скачено с отображением размера (KB/MB/GB...)
var SizeFilesUploadedStr = "";
//Сколько осталось скачать (в байтах)
var SizeRemainsDownload = -1;
//Сколько осталось скачать с отображением размера (KB/MB/GB...)
var SizeRemainsDownloadStr = "";

//Вес файла (в байтах) который в данный момент скачивается 
var GetInfoDownloadFile = 0;
//Вес файла (в байтах) который в данный момент скачивается (KB/MB/GB...) 
var GetInfoDownloadFileStr = "";
//Кол-во файлов которые необходимо будет обновить
var CountFilesDBUpdate = 0;


// Делаем запрос к лаунчеру, чтоб знать статус, да и вообще что происходит
info();

if(Status == 1 || Status == 2){
	info();
}

/*
	Когда пользователь нажимает на элемент с id=GU_patch
*/
$('#GU_patch').on('click', function() {
	var data = start("patch");
	info();
});


/*
	updateDBname - сюда передаем название базы
	Чтоб выключить загрузку, просто отпарвляем запрос на обновление (во время загрузки)
*/
function start(updateDBname) {
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/download',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {updateDBname: updateDBname},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){ 
			return data;
		}
	});
}

function info() {
	var timerRequest = setInterval(
		function(){
			if(activePage==false){
				return;
			}
			$.ajax({
				url: 'http://127.0.0.1:'+launcherPort+'/info',
				  xhrFields: {
					withCredentials: false
				},
				method: 'post',           
				dataType: 'json',
				crossDomain: true,
				contentType: 'application/x-www-form-urlencoded',
				processData: true,
				error: function(xhr, status, error) {
					$("#GU_patchEvent").text("Скачайте и запустите аптейдер");
					clearInterval(timerRequest);
				},
				success: function(data){ 
					Status = data.Status;
					LastMsg = data.LastMsg;
					CountFiles = data.CountFiles;
					CountFilesUploaded = data.CountFilesUploaded;
					FullSizeFileStr = data.FullSizeFileStr;
					FullSizeFiles = data.FullSizeFiles;
					SizeFilesUploaded = data.SizeFilesUploaded;
					SizeFilesUploadedStr = data.SizeFilesUploadedStr;
					SizeRemainsDownload = data.SizeRemainsDownload;
					SizeRemainsDownloadStr = data.SizeRemainsDownloadStr;
					GetInfoDownloadFile = data.GetInfoDownloadFile;
					CountFilesDBUpdate = data.CountFilesDBUpdate;

					switch (Status) {
					  case 0:
							clearInterval(timerRequest);
						break;
						
					  case 1:
							$("#GU_patch").text("Отменить загрузку");
							$("#GU_patchEvent").text(data.LastMsg);
							if(data.CountFiles>0){
								$("#GU_patchEvent").text("Скачено "+data.ProcentLoad+"% [ "+data.CountFilesUploaded+" из "+data.CountFiles+" ]");
								$("#GU_patchEvent").append('<br><progress value="'+data.ProcentLoad+'" max="100"></progress>');
								$("#GU_patchEventAddLine").text("Осталось "+data.SizeRemainsDownloadStr);
							}
						break;
						
					  case 5:
					  case 6:
							clearInterval(timerRequest);
							$("#GU_patch").text("Обновление завершено");
							$("#GU_patchEvent").text(data.LastMsg);
							$("#GU_patchEventAddLine").text("");
							$("#GU_patchEventAddLine").append("<a id='l2exe' data-exe='system-ru/L2.exe' data-args=''>Запустить игру (Ru.Ver.)</a>");
							$("#GU_patchEventAddLine").append("<a id='l2exe' data-exe='system-ru/L2.exe' data-args=''>Start game (Eng.Ver.)</a>");
							$("#GU_patchEventAddLine").append("<a id='cmd' data-command='netsh winsock reset netsh int ip reset all netsh winhttp reset proxy ipconfig /flushdns' >Reset DNS</a>");
						break;
						
					  case 7:
					  case 9:
							clearInterval(timerRequest);
							$("#GU_patch").text("Обновить патч");
							$("#GU_patchEvent").text(data.LastMsg);
						break;
						
					  case 8: //Произошла ошибка (к примеру, память диска закончилась)
							clearInterval(timerRequest);
							$("#GU_patchEvent").text("Ошибка обновления");
 							$("#GU_patchEvent").append("<br>Error: "+data.LastMsg);
						break;
						
					}
 					console.log(data);
				}
			}) 
	}, timeoutRequest);
	
}


$(document).delegate("#l2exe", "click", function () {
	var exe = $(this).data("exe");
	var args = $(this).data("args");
 	l2exe(exe, args);
});
/*
	Для запуска игры
	Специально сделано что после обновления можно добавить кнопку запуска игры
	В аргумент сюда передаем адрес к запуску клиента, к примеру system/L2.bin
	второй параметр другие аргументы к запуску
	Обратите внимание, что регистр имеет значение!
*/
function l2exe(exe, args){
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/game/start',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {exe: exe, args: args},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			return data;
		}
	});
}


$(document).delegate("#cmd", "click", function () {
	var command = $(this).data("command");
 	cmd(command);
});

/*
	Иногда пользователю нужно к примеру обновить DNS, а может ещё что-то сделать в командной строке
	Эта функция для этого, передаем строку запроса в аргумент.
	К примеру
	netsh winsock reset netsh int ip reset all netsh winhttp reset proxy ipconfig /flushdns
*/
function cmd(command){
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/cmd',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {command: command},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){ 
			return data;
		}
	});
}


//пользователь на вкладке сайте
window.onfocus = function(){ 
	timeoutRequest = 800;
	activePage = true;
}

//пользователь закрыл вкладку или переключил на другую
window.onblur = function(){ 
	// activePage = false;
	timeoutRequest = 1500;
}
