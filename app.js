//ployfill
if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement /*, fromIndex*/) {
        'use strict';
        if (this == null) {
            throw new TypeError('Array.prototype.includes called on null or undefined');
        }

        var O = Object(this);
        var len = parseInt(O.length, 10) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(arguments[1], 10) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) {
                k = 0;
            }
        }
        var currentElement;
        while (k < len) {
            currentElement = O[k];
            if (searchElement === currentElement ||
                (searchElement !== searchElement
                	&& currentElement !== currentElement)) { // NaN !== NaN
                return true;
            }
            k++;
        }
        return false;
    };
}

var Util = {
	$: function(ele) {
		return document.querySelector(ele);
	},
	getData: function(url, callback) {
		var openRequest = new XMLHttpRequest();
		openRequest.addEventListener("load", function (e) {
			var data = JSON.parse(openRequest.responseText);
			callback(data);
		}.bind(this));
		openRequest.open("GET", url);
		openRequest.send();
	}
}

function DomContainer() {
	this.appBar = Util.$('.app-bar');
	this.searchButton = Util.$('.search-button');
	this.searchBar = Util.$('.search-bar');
	this.searchField = Util.$('#search-field');
	this.autoCompleteList = Util.$('.auto-complete-list');
}

DomContainer.prototype = {
	getHoveredItem: function() {
		return Util.$('.hover');
	}
}

function SearchWindow(apiUrl, domContainer) {
	this.apiUrl = apiUrl;
	this.domContainer = domContainer;
	this.memo = {};
	this.memoLog = [];
	this.memoSize = 100;

	this.domContainer.searchField.addEventListener('keydown', this.checkKeyCode.bind(this));
	this.domContainer.searchField.addEventListener('input', this.changeSearchText.bind(this));

	this.domContainer.autoCompleteList.addEventListener('mouseover', this.mouseOver.bind(this));
	this.domContainer.autoCompleteList.addEventListener('click', this.clickedItem.bind(this));

	this.domContainer.searchButton.addEventListener('click', this.clickedSearchButton.bind(this));
}

SearchWindow.prototype = {
	caching: function(key, value) {
		if (this.memo.hasOwnProperty(key)) {
			return;
		}

		if (this.memoLog.length > this.memoSize) {
			let key = this.memoLog.shift();
			delete this.memo[key];
		}

		this.memo[key] = value;
		this.memoLog.push(key);
	},
	updateRendering: function(keyword, autoComplete) {
		const listDom = this.domContainer.autoCompleteList;
		if(!autoComplete){
			listDom.innerHTML = ""
			return false
		}

		let listDomHTML = "";
		autoComplete.forEach((item) => {
			const itemHTML = item[0].replace(keyword, "<span>" + keyword + "</span>");
			let itemDom = "<li data-name='" +item[0] + "'>" + itemHTML + "</li>";
			listDomHTML += itemDom;
		});

		listDom.innerHTML = listDomHTML;
	},
	launchSearchEvent: function(keyword) {
		window.location.reload();
	},
    pressedUpKey() {
        let currHoveredItem = this.domContainer.getHoveredItem();
        if(!currHoveredItem) {
            return;
        }
        if(currHoveredItem.previousElementSibling) {
            currHoveredItem.previousElementSibling.classList.add('hover');
            currHoveredItem.classList.remove('hover');
        }
    },
    pressedDownKey() {
        let currHoveredItem = this.domContainer.getHoveredItem();
        if(!currHoveredItem) {
            const autoCompleteList = this.domContainer.autoCompleteList;
            if(autoCompleteList.childNodes) {
                autoCompleteList.childNodes[0].classList.add('hover')
            }
            return;
        }
        if(currHoveredItem.nextElementSibling) {
            currHoveredItem.nextElementSibling.classList.add('hover');
            currHoveredItem.classList.remove('hover');
        }
    },
    pressedEnterKey() {
        let currHoveredItem = this.domContainer.getHoveredItem();
        if(!currHoveredItem) {
            this.launchSearchEvent();
            return;
        }
        this.putSelectedItemToField(currHoveredItem.dataset.name);
    },
	checkKeyCode: function(e) {
		switch(e.keyCode){
			case 38: //ArrowUp
				this.pressedUpKey()
				break;
			case 40: //ArrowDown
				this.pressedDownKey()
				break;
			case 13: //Enter
				this.pressedEnterKey()
                break;
		}
	},
	changeSearchText: function(e) {
		const keyword = e.target.value;
		if (this.memo.hasOwnProperty(keyword)) {
			this.updateRendering(keyword, this.memo[keyword]);
			return;
		}

		const url = this.apiUrl + keyword;
		Util.getData(url, function(returnData) {
			this.caching(keyword, returnData[1]);
			this.updateRendering(keyword, this.memo[keyword]);
		}.bind(this));
	},
    changeHoveredItem(item) {
        let currHoveredItem = this.domContainer.getHoveredItem();
		if(currHoveredItem) {
			currHoveredItem.classList.remove('hover');
		}
		item.classList.add('hover');
    },
	mouseOver: function(e) {
		let item = e.target;
		if(!item || item.nodeName !== 'LI') {
			return;
		}
        this.changeHoveredItem(item)
	},
	clickedItem: function(e) {
		let item = e.target;
		if(!item || item.nodeName !== 'LI') {
			return;
		}
		this.putSelectedItemToField(item.dataset.name);
	},
	clickedSearchButton: function(e) {
		this.launchSearchEvent();
	},
	putSelectedItemToField: function(word) {
		const searchField = this.domContainer.searchField;
		searchField.value = word;

		this.domContainer.autoCompleteList.innerHTML = '';
	}
}

// document.addEventListener('DOMContentLoaded', function () {
	const baseApiUrl = "http://crong.codesquad.kr:8080/ac/";
	const domContainer = new DomContainer();
	const searchWindow = new SearchWindow(baseApiUrl, domContainer);
// });
