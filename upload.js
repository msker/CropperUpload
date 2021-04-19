define(['extra/cropper/cropper.min', 'css!extra/cropper/cropper.min.css'], function(Cropper) {
	$.fn.uploader = function(options) {
		var self = $(this);
		var cropper;
		var settings = $.extend({
			url: '', //上传URL
			data: {}, //上传发送数据
			cut: false, //是否裁剪
			ratio: '1.5', //裁剪比例
			size: '500', //限制文件大小KB
			field: 'image', //文件域
			multiple: false, //批量上传
			before: function(self) {
				return true;
			},
			success: function(data) { //上传完成回调
			},
		}, options);


		if (settings.cut == true) {
			settings.multiple = false;
		}

		self.exts = ["image/png", "image/jpeg", "image/jpg", "image/bmp"];

		self.after('<input type="file" accept ="' + self.exts.join(",") + '" name="' + settings.field +
			'"' + (settings.multiple ? ' multiple="multiple "' : '') + ' style="display:none;">');

		self.on('click', function() {
			if (!settings.before(self)) {
				return false;
			}
			$(document).find("[name='" + settings.field + "']").trigger('click');
		});

		$(document).on("change", "[name='" + settings.field + "']", function(e) {
			$.each(e.target.files, function() {
				self.start(this);
			})
			$(this).val('');

		});

		//运行
		self.start = function(file) {
			var reader = new FileReader();
			if (self.exts.indexOf(file.type) == -1) {
				layer.msg('上传图片格式不正确');
				return;
			}
			var _fileSize = Math.floor(file.size / 1024);
			if (_fileSize > settings.size) {
				layer.msg('图片大小限制在' + settings.size + 'KB内，当前大小' + _fileSize + 'KB');
				return;
			}

			reader.readAsDataURL(file);
			reader.onload = function(ld) {

				var imgData = ld.target.result;
				if (settings.cut) {
					self.cut(imgData);
				} else {
					var blob = self.toBlob(imgData);
					self.upload(blob);
				}
			}
		}

		//裁剪
		self.cut = function(imgData) {
			self.cutWin = layer.open({
				title: "图片裁剪(" + settings.ratio + ":1)",
				area: ['600px', '540px'],
				content: '<div id="cutImgWin"><img src="' + imgData +
					'" width="100%" id="cutImgView" style="width:600px;min-height:400px;max-height: 400px"></div>',
				success: function() {
					var image = document.getElementById('cutImgView');
					cropper = new Cropper(image, {
						aspectRatio: settings.ratio,
						viewMode: 1,
						strict: false,
					});
				},
				btn: ['确定裁剪'],
				yes: function() {
					cropper.getCroppedCanvas().toBlob((blob) => {
						self.upload(blob);
					});
				}
			});
		}

		//上传
		self.upload = function(blob) {
			var formData = new FormData();
			formData.append(settings.field, blob);
			Object.keys(settings.data).forEach((key) => {
				formData.append(key, settings.data[key]);
			})

			var loading = layer.load();
			$.ajax(settings.url, {
				type: 'POST',
				data: formData,
				dataType: 'json',
				processData: false,
				contentType: false,
				success: function(res) {
					layer.close(loading);
					if (res.code == 1) {
						layer.close(self.cutWin);
						settings.success(res,self);
					} else {
						layer.msg(res.msg);
					}
				},
				error: function(res) {
					layer.close(self.cutWin);
					layer.close(loading);
					layer.msg('文件上传失败');
				}
			});
		}


		//转码
		self.toBlob = function(dataurl) {
			var arr = dataurl.split(','),
				mime = arr[0].match(/:(.*?);/)[1],
				bstr = atob(arr[1]),
				n = bstr.length,
				u8arr = new Uint8Array(n);
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
			}
			return new Blob([u8arr], {
				type: mime
			});
		}
	}
});