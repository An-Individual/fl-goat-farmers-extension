function InjectScript(func)
{
	var actualCode = '(' + func + ')();';
	var script = document.createElement('script');
	script.textContent = actualCode;
	(document.head||document.documentElement).appendChild(script);
	//script.parentNode.removeChild(script);
}

function NativeScript()
{
	var buttonHtml = '<a id="bazaarTab" href="#">BAZAAR</a>'
	var targetValue = 0;
	var currentValue = 0;
	var userName = $(".subscription-username").text();
	var imagePath = ".item-icon .tooltip div img";
	
	var parent = $("#bazaarTab").parent().get();
	$("#bazaarTab").remove();

	$(parent).append(buttonHtml);

	if(localStorage)
	{
		targetValue = parseInt(localStorage.getItem("flgf_" + userName));
	}
	
	function UpdateTargetValue()
	{
		var stringValue = window.prompt("Please enter your target wealth in echoes.", ConvertToEchoes(targetValue));
		
		if(!stringValue)
		{
			return;
		}
		
		var idx = stringValue.indexOf(".");
		if(idx < 0)
		{
			targetValue = parseInt(stringValue) * 100;
		}
		else
		{
			stringValue = stringValue.slice(0, idx + 3);
			
			while(stringValue.length < idx + 3)
			{
				stringValue += "0";
			}
			
			stringValue = stringValue.replace(".", "");
			targetValue = parseInt(stringValue);
		}
		
		if(targetValue < 0)
		{
			targetValue = 0;
		}
		
		if(localStorage)
		{
			localStorage.setItem("flgf_" + userName, targetValue);
		}
		
		$("#flgf-value-dif").html(ConvertToEchoes((targetValue || 0) - currentValue));
	}
	
	function UpdateReserve(itemId)
	{
		var stringValue = window.prompt("Enter the number of items you want to reserve.", GetReserve(itemId));
		
		if(!stringValue)
		{
			ClearReserve(itemId);
			$("#" + itemId + " .flgf-reserve-value").html("");
			CalculateTotal();
			return;
		}
		
		var value = parseInt(stringValue);
		if(value <= 0)
		{
			$("#" + itemId + " .flgf-reserve-value").html("");
			ClearReserve(itemId);
			CalculateTotal();
			return;
		}
		
		SetReserve(itemId, value);
		
		$("#" + itemId + " .flgf-reserve-value").html("Reserved: " + value);
		
		CalculateTotal();
	}
	
	function ConvertToEchoes(pence)
	{
		pence = pence || 0;
		if(pence < 0)
		{
			pence = 0;
		}
	
		var totalString = (pence).toString();
		while(totalString.length < 3)
		{
			totalString = "0" + totalString;
		}
		
		var totalEchoes = totalString.slice(0, totalString.length - 2);
		var totalPence = totalString.slice(totalEchoes.length);
		return totalEchoes + "." + totalPence;
	}
	
	function CalculateTotal()
	{
		var prices = $("li.shop-item").map(function(index,el)
		{
			var result = {};
			if(!IsExcluded(el.id))
			{
				var price = 0;
				var valueString = $(el).find(".currency-echo").html();
				if(valueString)
				{
					price = parseInt(valueString.replace(".", ""));
				}
				
				var quantity = parseInt($(el).find("div.item-quantity").html()) - GetReserve(el.id);
				
				if(quantity < 0)
				{
					quantity = 0;
				}
				
				return price * quantity;
			}
			else
			{
				return 0;
			}
		});
		
		var currentElem = $("div.you_lhs").find("span.currency-echo").html();
		var current = 0;
		if(currentElem)
		{
			var current = parseInt(currentElem.replace(".", ""));
		}
		
		currentValue = current;
		for(var index = 0; index < prices.length ; index++)
		{
			currentValue += prices[index];
		}
		
		$("#flgf-value-current").html(ConvertToEchoes(currentValue));
		$("#flgf-value-dif").html(ConvertToEchoes((targetValue || 0) - currentValue));
	}
	
	function IsExcluded(itemId)
	{
		return localStorage.getItem("flgf_" + userName + itemId + "_exclusion") == "X";
	}
	
	function SetExcluded(itemId)
	{
		localStorage.setItem("flgf_" + userName + itemId + "_exclusion", "X");
	}
	
	function SetIncluded(itemId)
	{
		localStorage.removeItem("flgf_" + userName + itemId + "_exclusion");
	}
	
	function SetReserve(itemId, value)
	{
		localStorage.setItem("flgf_" + userName + itemId + "_reserve", value);
	}
	
	function GetReserve(itemId)
	{
		var valueString = localStorage.getItem("flgf_" + userName + itemId + "_reserve");
		if(valueString)
		{
			var value = parseInt(valueString);
			if(value > 0)
			{
				return value;
			}
		}
		
		return 0;
	}
	
	function ClearReserve(itemId)
	{
		localStorage.removeItem("flgf_" + userName + itemId + "_reserve");
	}
	
	function SetupItemClickEvents()
	{
		$($("li.shop-item").get()[0]).addClass("flgf-init-track");
		if(!localStorage)
		{
			return;
		}
		
		$("li.shop-item h6").append('<div class="flgf-reserve-value"></div>');
		
		$("li.shop-item").each(function(idx, elem)
		{
			var elemId = elem.id;
			
			if(IsExcluded(elemId))
			{
				$(elem).find(imagePath).addClass("flgf-excluded");
			}
			
			var reserved = GetReserve(elemId);
			if(reserved > 0)
			{
				$(elem).find(".flgf-reserve-value").html("Reserved: " + reserved);
			}
		});
		
		$("li.shop-item .item-icon").addClass("flgf-clickable");
		$("li.shop-item .item-icon").click(function(event)
		{
			var parent = $(event.target).parents("li.shop-item").get()[0];
			var itemId = parent.id;
			
			if(IsExcluded(itemId))
			{
				SetIncluded(itemId);
				$(parent).find(imagePath).removeClass("flgf-excluded");
			}
			else
			{
				SetExcluded(itemId);
				$(parent).find(imagePath).addClass("flgf-excluded");
			}
			
			CalculateTotal();
		});
		
		$('<button class="shop_btn pull-right flgf-reserve-btn" title="Please select a number to reserve">Reserve</button>').insertAfter("li.shop-item .shop_btn");
		
		$(".flgf-reserve-btn").click(function(event)
		{
			var parent = $(event.target).parents("li.shop-item").get()[0];
			var itemId = parent.id;
			
			UpdateReserve(itemId);
		});
	}
	
	function CheckReinitializeItems()
	{
		if(!$("#bazaarTab").hasClass("selected"))
		{
			return;
		}
		
		if($($(".shop-categories ul li.cf").get()[0]).hasClass("active") &&
			!$($("li.shop-item").get()[0]).hasClass("flgf-init-track"))
		{
			SetupItemClickEvents();
		}
		
		setTimeout(CheckReinitializeItems, 200);
	}
	
	$("#bazaarTab").click(function()
	{
		return loadMainContent('/Bazaar', this.id, function()
		{
			var sumElement = '<p id="flgf-value">Total Wealth: <span id="flgf-value-current" class="currency-echo">0.00</span><br />To Target (<a id="flgf-update" href="#">update</a>): <span id="flgf-value-dif" class="currency-echo">0.00</span></p>';
			
			$(sumElement).insertAfter("#mainContentViaAjax h3.redesign");
			
			CalculateTotal();
			
			$("#flgf-update").click(UpdateTargetValue);
			SetupItemClickEvents();
			CheckReinitializeItems();
		});
	});
}

InjectScript(NativeScript);