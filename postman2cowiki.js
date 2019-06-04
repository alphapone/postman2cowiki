// Postman to confluence wiki converter
// run it from command line using node postman2cowiki.js postman
// target language is russian
// -------------------------------------------------------------

const os = require('os');
const eol = os.EOL;
const fs = require('fs');

const docjson = process.argv[2];

let docname = process.argv[3];

// Menu
const renderMenu = (items) => {
    let menuDOM = '';

    items.forEach((item, index) => {
   
        const subItems = item.item;

      
        menuDOM = menuDOM + `* [#Запросы ${item.name}](#${index})${eol}`;

 
        if (subItems !== undefined) {
            subItems.forEach((subItem, subItemIndex) => {
                menuDOM = menuDOM + `  ** [#Запрос ${subItem.name}](#${index}-${subItemIndex})${eol}`;
            })
        }
    });

    return menuDOM;
};

// RequestHeader
const renderRequestHeader = (headerList) => {
    const headerThead = 'h4. Поля заголовка запроса' + eol +
                        '|| Имя поля || Значение || Комментарий ||' + eol                  
    let headerDoc = '';

    if (headerList.length > 0) {
        headerDoc = headerThead + headerList.map((item) => {
	    let des = '';

      	    if (item.description !== undefined) {
	       	des = item.description;
            }

            return `| ${item.key} | ${item.value} | ${des} | ${eol}`;
        }).join('');
    }

    return headerDoc;
};

// RequestBodyb 
const renderRequestBody = (requestBodyData) => {
    const bodyThead = 'h4. Поля тела запроса' + eol +
                        '|| Имя поля || Значение || Тип || Комментарий ||' + eol                        
    let bodyDoc = '';

    if (requestBodyData !== undefined && requestBodyData.mode !== undefined && requestBodyData[requestBodyData.mode] !== undefined) {
	        if (Array.isArray(requestBodyData[requestBodyData.mode])) {
		        bodyDoc = bodyThead + requestBodyData[requestBodyData.mode].map((item) => {
        		    let des = '';

	        	    if (item.description !== undefined) {
        	        	des = item.description;
		            }
            
        		    return `| ${item.key} | ${item.value} | ${item.type} | ${des} | ${eol}`;
	        	}).join('');		
		} else {
                        if (requestBodyData[requestBodyData.mode] !== undefined && requestBodyData[requestBodyData.mode] !== '') {
                                bodyDoc = 'Пример запроса: ' + eol + '{code}' + requestBodyData[requestBodyData.mode] + '{code}';
                        }
		}
    }

    return bodyDoc;
};

const renderDocOfItem = (item, id) => {
    let md = '';
    let requestMethod = '';
    let requestTitle = '';
    let requestDescription = '';
    let requestUrl = '';
    let requestHeader = '';
    let requestBody = '';

    requestMethod = '||Метод||'  + item.request.method + '|';
    requestTitle =  '||Запрос||' + item.name + '||';
    requestHeader = renderRequestHeader(item.request.header);
    requestBody = renderRequestBody(item.request.body);

    requestDescription = '||Описание||' + item.request.description;

    if (item.request.url !== undefined && item.request.url.raw !== undefined) {
       requestUrl = '||Ресурс||{code}' + item.request.url.raw + '{code}|';
    } else {
       requestUrl = '||Ресурс||{code}' + item.request.url + '{code}|';
    }

    md = "h3. Запрос " + item.name + eol +
         requestMethod + eol +
	 requestTitle + eol +
         requestUrl + eol +
         requestDescription + eol +
         requestHeader + eol +
         requestBody + eol +
	 "----" + 	
         eol;

    return md;
};

const renderDoc = (apidoc) => {
    const {
        info,
        item: items,
    } = apidoc;
    
    let docDOM = `# ${info.name}` + eol +
                 renderMenu(items) + eol;

    items.forEach((item, index) => {
        const subItems = item.item;
        let folderTitle = '';
        let folderDescription = '';

        if (subItems === undefined) {            
            docDOM = docDOM + renderDocOfItem(item, index);
        } else {            
            folderTitle = "h2. Запросы " + item.name;

            if (item.description !== '' && item.description !== undefined) {
                folderDescription = eol + item.description + eol;
            } else {
                folderDescription = eol;
            }

            docDOM = docDOM +
                     folderTitle +
                     folderDescription +
                     subItems.map((subItem, subItemIndex) => {
                         return renderDocOfItem(subItem, `${index}-${subItemIndex}`);
                     }).join('');

            docDOM = docDOM + eol + "----" + eol;
            docDOM = docDOM + "Сгенерировано из postmnan с помощью postman2cowiki" + eol;
        }
    });

    return docDOM; 
};


const renderCowikiFile = (apidoc) => {
    const doc = renderDoc(apidoc);

    if (docname === undefined) {
        docname = `${apidoc.info.name}.cowiki`;
    }

    fs.open(docname, 'w', 0644, function(err, fd){
        if (err) {
            return console.log(err);
        }

        fs.write(fd, doc, function(e){
            if (e) {
                return console.log(e);
            }
            fs.closeSync(fd);
        });
    });
};

fs.readFile(docjson, function(err, data){
    if (err) {
        return console.error(err);
    }

    renderCowikiFile(JSON.parse(data));
});

