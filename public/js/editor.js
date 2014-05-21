function sendData(d) {
	$.ajax({
		url: '/data',
		type: 'POST',
		data: JSON.stringify(d),
		contentType: 'application/json; charset=utf-8',
		dataType: 'text',
		success: function(data) {
			console.log(data);
		}
	});

}

function rgb2hex(rgb) {
	
	function hex(x) {
		return ("0" + parseInt(x).toString(16)).slice(-2);
	}
	var r = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	var h = '#' + hex(r[1]) + hex(r[2]) + hex(r[3]);
	return h.toUpperCase();

}

function doSave2(evt, pushToServer) {
	
	var sizerWidth = Number($('#sizer').css('width').replace(/\D/g, ''));
	
	var ct = $('#ctitle').val();
	var pd = $('#pubDate').val();
	
	var cobj = {
		pubDate: pd,
		title: ct,
		cells: []
	};
	
	$('#sizer div.box').each(function(idx, elem) {
		
		var sizerHeight = Number($(elem).css('height').replace(/\D/g, ''));
		
		var bgc =$(elem).css('background-color');
		if (bgc.search("rgb") != -1) {
			bgc = rgb2hex(bgc);
		}
		
		var b = {
			background: bgc,
			bubble: undefined,
			imgs: []
		};
		
		$(elem).find("p.bubble").each(function(idx, elem) {
			var cssTop = $(elem).css('top');
			var cssLeft = $(elem).css('left');
			var cssWidth = $(elem).css('width');
			var sp = $(elem).hasClass('bubble25') ? 25 : ($(elem).hasClass('bubble75') ? 75 : 50);
			
			// positions need converted to %
			var t = Number(cssTop.replace('px', ''));
			var l = Number(cssLeft.replace('px', ''));
			var w = Number(cssWidth.replace('px', ''));
			t = t * (1 / sizerHeight) * 100;
			l = l * (1 / sizerWidth) * 100;
			w = w * (1 / sizerWidth) * 100;
			
			$(elem).find("span").each(function(idx, elem) {
				b.bubble = {
						top: t,
						left: l,
						width: w,
						stemPos: sp,
						text: $(elem).text()
				};
			});
		});
		
		$(elem).find(".divimg").each(function(idx, elem) {
			
			var cssTop = $(elem).css('top');
			var cssLeft = $(elem).css('left');
			
			// positions need converted to %
			var t = Number(cssTop.replace('px', ''));
			var l = Number(cssLeft.replace('px', ''));
			t = t * (1 / sizerHeight) * 100;
			l = l * (1 / sizerWidth) * 100;
			
			$(elem).find("div.ui-wrapper").each(function(idx, elem) {
				
				// width needs converted to %
				var cssWidth = $(elem).css('width');
				var w = Number(cssWidth.replace('px', ''));
				w = w * (1 / sizerWidth) * 100;
				
				$(elem).find("img").each(function(idx, elem) {
					var s = elem.src;
					s = s.substring(s.lastIndexOf('/')+1);
					b.imgs.push({
						top: t,
						left: l,
						width: w,
						src: s
					});
				});
			});
		});
		
		cobj.cells.push(b);
		
	});
	
	console.log(cobj);
	
	if (pushToServer) {
		sendData(cobj);
	}

}

function addImage(cell, img) {

	getImageAttributes(img.src, function(err, imgSize) {

		if (!err) {

			var sizerWidth = Number($('#sizer').css('width').replace(/\D/g, ''));
			var sizerHeight = Number($(cell).css('height').replace(/\D/g, ''));

			var d = document.createElement('div');
			var i = document.createElement('img');

			var w = (img.width / 100) * sizerWidth;
			var h = w / (imgSize.width / imgSize.height);

			var l = (img.left / 100) * sizerWidth; 
			var t = (img.top / 100) * sizerHeight;

			$(i).css('height', h + 'px');

			$(i).css('width', w + 'px');
			$(i).css('top', t + 'px');
			$(i).css('left', l + 'px');
			$(i).attr('src', '/images/' + img.src);

			$(d).addClass('divimg');
			$(d).append(i);

			// see http://stackoverflow.com/questions/4948582/jquery-draggable-and-resizable
			$(cell).append(d);

			$(d).draggable();
			$(i).resizable({aspectRatio: true});

		}

	});
	
}

function addCell(c) {

	var d = document.createElement('div');
	$(d).addClass('box');
	$('#sizer').append(d);
	
	if (c) {
		
		$(d).css('background-color', c.background);
		$.each(c.imgs, function(idx, obj) {
			addImage(d, obj);
		});
		
	}

}

function getImageAttributes(image, cb) {
	
	$.ajax({
		url: '/images/' + image,
		type: 'GET',
		dataType: 'xml',
		success: function(data) {
			var w = data.rootElement.getAttribute('width');
			var h = data.rootElement.getAttribute('height');
			cb(null, {
				width: w,
				height: h
			});
		},
		error: function() {
			cb(new Error('could not get image attributes'));
		}
	});
	
	
}

function toggleStemPosition(obj) {
	
	var t = obj.target;
	if ($(t).hasClass('bubble50')) {
		$(t).removeClass('bubble50');
		$(t).addClass('bubble75');
	} else if ($(t).hasClass('bubble75')) {
		$(t).removeClass('bubble75');
		$(t).addClass('bubble25');
	} else if ($(t).hasClass('bubble25')) {
		$(t).removeClass('bubble25');
		$(t).addClass('bubble50');
	}
	
}

function setupMenu(imgSelectOptions) {
	
	$.contextMenu( 'destroy' );
	
	$.contextMenu({
		
		zIndex: 100,
		selector: '.box',
		items: {
			bgcolor: {
				name: 'Background',
				type: 'text',
				value: '#FFFFFF'
			},
			sep1: "----------",
			pickImage: {
				name: "Select Image",
				type: 'select',
				options: imgSelectOptions
			},
			addImage: {
				name: "Add Image",
				callback: function(key, options) {
					
					var $this = this;
					var o = $.contextMenu.getInputValues(options, $this.data());
					var selectedImage = o.pickImage;
					
					if (selectedImage) {
						
						getImageAttributes(selectedImage, function(err, ia) {
							
							if (err) {
								console.error(err);
							} else {

								var d = document.createElement('div');
								var i = document.createElement('img');

								$(i).css('height', ia.height + 'px');
								$(i).css('width', ia.width + 'px');
								$(i).attr('src', '/images/' + selectedImage);

								$(d).addClass('divimg');
								$(d).append(i);

								// see http://stackoverflow.com/questions/4948582/jquery-draggable-and-resizable
								$(options.$trigger).append(d);

								$(d).draggable();
								$(i).resizable({aspectRatio: true});
								
							}

						});

					}

				}
			},
			sep2: "----------",
			addBubble: {
				name: "Add Bubble",
				callback: function(key, options) {

					var p = document.createElement('p');
					var s = document.createElement('span');
					$(s).append(document.createTextNode('what does the frog say?'));
					
					$(p).addClass('bubble');
					$(p).addClass('bubble-text');
					$(p).addClass('bubble50');
					$(p).append(s);
					
					$(p).dblclick(toggleStemPosition);
					
					$(options.$trigger).append(p);
					$(p).draggable().resizable();
					$(s).editable({
						type: 'text',
						mode: 'inline',
						success: function(response, newValue) {
							console.log(newValue);
						}
					});
				}
			}

		},
		events: {
			show: function(opt) {
				var $this = this;
				var bgc = $this.css('background-color');
				if (bgc.search("rgb") != -1) {
					bgc = rgb2hex(bgc);
				}
				var d = {
					bgcolor: bgc
				};
				$.contextMenu.setInputValues(opt, d);
			},
			hide: function(opt) {
				var $this = this;
				var o = $.contextMenu.getInputValues(opt, $this.data());
				var c = o.bgcolor;
				if (c.search(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) != -1) {
					console.log('good color: ' + c);
					$this.css('background-color', c.toUpperCase());
				}
			}
		}
		
	});

	
	$.contextMenu({
		
		zIndex: 100,
		selector: '.divimg',
		items: {
			width: {
				name: 'Width',
				type: 'text',
				value: ''
			},
			left: {
				name: 'Left',
				type: 'text',
				value: ''
			},
			top: {
				name: 'Top',
				type: 'text',
				value: ''
			},
			sep1: "----------",
			pickImage: {
				name: "Select Image",
				type: 'select',
				options: imgSelectOptions
			},
			addImage: {
				name: "Change Image",
				callback: function(key, options) {
					
					var $this = this;
					var o = $.contextMenu.getInputValues(options, $this.data());
					var selectedImage = o.pickImage;
					
					
					
					
					$(options.$trigger).find("img").each(function(idx, elem) {
						$(elem).attr('src', '/images/' + selectedImage);
					});
					
				}
			},
			sep2: "----------",
			moveBack: {
				name: "Move Back",
				callback: function(key, options) {
					var n = options.$trigger;
					n.insertBefore(n.prev());
				}
			},
			moveUp: {
				name: "Move Forward",
				callback: function(key, options) {
					var n = options.$trigger;
					n.insertAfter(n.next());
				}
			},
			sep3: "----------",
			addBubble: {
				name: "Delete",
				callback: function(key, options) {
					$(options.$trigger).detach();
				}
			}

		},
		events: {
			show: function(opt) {
				var $this = this;
				var img = $this.find('img');
				var w = img.css('width');
				var t = $this.css('top');
				var l = $this.css('left');
				var isrc = img.attr('src');
				isrc = isrc.substring(isrc.lastIndexOf('/')+1);
				var d = {
					width: w,
					top: t,
					left: l,
					pickImage: isrc
				};
				$.contextMenu.setInputValues(opt, d);
			},
			hide: function(opt) {
				var $this = this;
				var o = $.contextMenu.getInputValues(opt, $this.data());
				$this.css('top', o.top);
				$this.css('left', o.left);
				var img = $this.find('img');
				if (img.css('width') !== o.width) {
					img.resizable('destroy');
					img.css('width', o.width);
					img.css('height', o.width);
					img.resizable({aspectRatio: true});
				}
			}
		}
		
	});
	
	
}

function toggleImgUpload() {
	
	$('#myModal').modal('toggle');
	
}

function showComicList() {
	
	$('#loadModal').modal('toggle');
	$.ajax({
		url: '/list',
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			$.each(data, function(idx, val) {
				var oval = val.id + " :: " + val.published + " :: " + val.title;
				$('#comicSelect').append($("<option></option>").attr("value", val.id).text(oval));
			});
		}
	});
	
}

function doLoad() {
	
	var id = $('#comicSelect').val();

	$.ajax({
		url: '/data/' + id,
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			
			$('#loadModal').modal('toggle');
			
			$('#ctitle').val(data.title);
			$('#pubDate').val(data.pubDate);

			$.each(data.cells, function(idx, c) {
				addCell(c);
			});
			
		}
	});
	
}

$(function() {
	
	$('#addCellButton').click(addCell);
	$('#saveButton').click(doSave2);
	$('#addImageButton').click(toggleImgUpload);
	$('#loadButton').click(showComicList);
	$('#confirmLoadButton').click(doLoad);
	
});

$(function() {
	
	$('#imgUpload').iframePostForm({
		json: true,
		post: function() {
			console.log('starting upload');
		},
		complete: function(resp) {
			console.log(resp);
			$('#myModal').modal('toggle');
			buildMenu();
		}
	});
	
});

$(function() {
	
	$('#datePicker').datetimepicker({
		pickTime : false
	});
	
	$('#pubDate').val(moment().format('YYYY-MM-DD'));
	
});

function buildMenu() {
	
	$.ajax({
		url: '/images',
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			var sd = {};
			for (var i = 0; i < data.length; i++) {
				sd[data[i].filename]= data[i].filename;
			}
			setupMenu(sd);
		}
	});
	
}

$(function() {

	buildMenu();
	
});
