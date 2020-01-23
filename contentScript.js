var trans_popup = '';

function createPopup() {
    document.documentElement.appendChild(trans_popup)
    return $("<trans-popup>")
}

function removePopup() {
    $("trans-popup").each(function() {
        const self = this
        $(this.shadowRoot.querySelector('main')).fadeOut('fast', function() {self.remove()})
    })
    $('#trans-popup-template').remove()
}

function showTranslationPopup(e, content) {
    // Remove popup
    removePopup()

    const $popup = createPopup()
    $("body").append($popup);

    $popup.on("trans-popup-content-updated", function() {
        const pos = calculatePosition(e.clientX, e.clientY, $popup)
        $popup
            .each(function() {
                $(this.shadowRoot.querySelector('main')).hide()
            })
            .attr({ top: pos.y, left: pos.x })
            .each(function() {
                $(this.shadowRoot.querySelector('main')).fadeIn('fast')
            })
    })    
    $popup.attr('content', content)
}

function calculatePosition(x, y, $popup) {
    const pos = {}
    const margin = 5
    const anchor = 10
    const outerWidth = Number($popup.attr('outer-width'))
    const outerHeight = Number($popup.attr('outer-height'))

    // show popup to the right of the word if it fits into window this way
    if (x + anchor + outerWidth + margin < $(window).width()) {
        pos.x = x + anchor        
    }
    // show popup to the left of the word if it fits into window this way
    else if (x - anchor - outerWidth - margin > 0) {
        pos.x = x - anchor - outerWidth
    }
    // show popup at the very left if it is not wider than window
    else if (outerWidth + margin*2 < $(window).width()) {
        pos.x = margin
    }
    // resize popup width to fit into window and position it the very left of the window
    else {
        const non_content_x = outerWidth - Number($popup.attr('content-width'))

        $popup.attr('content-width', $(window).width() - margin*2 - non_content_x)
        $popup.attr('content-height', Number($popup.attr('content-height')) + 4)

        pos.x = margin
    }

    // show popup above the word if it fits into window this way
    if (y - anchor - outerHeight - margin > 0) {
        pos.y = y - anchor - outerHeight
    }
    // show popup below the word if it fits into window this way
    else if (y + anchor + outerHeight + margin < $(window).height()) {
        pos.y = y + anchor
    }
    // show popup at the very top of the window
    else {
        pos.y = margin
    }

    return pos
}

function formatTranslation(translation) {
    return `
        <div class="content">
            <span class="translation"> ${translation} </span>
        </div>
    `
}

function escape_html(text) {
    return text.replace(XRegExp('(<|>|&)', 'g'), function ($0, $1) {
        switch ($1) {
            case '<': return '&lt;'
            case '>': return '&gt;'
            case '&': return '&amp;'
        }
    })
}

function process(e) {

	function getHitWord(e) {
  
        function restorable(node, do_stuff) {
            $(node).wrap('<transwrapper />')
            const res = do_stuff(node)
            $('transwrapper').replaceWith(escape_html( $('transwrapper').text() ))
            return res
        }
  
        function getExactTextNode(nodes, e) {
            $(text_nodes).wrap('<transblock />')
            let hit_text_node = document.elementFromPoint(e.clientX, e.clientY)
    
            //means we hit between the lines
            if (hit_text_node.nodeName != 'TRANSBLOCK') {
                $(text_nodes).unwrap()
                return null
            }
    
            hit_text_node = hit_text_node.childNodes[0]
    
            $(text_nodes).unwrap()
    
            return hit_text_node
        }
  
        const hit_elem = $(document.elementFromPoint(e.clientX, e.clientY))
        const word_re = '\\p{L}+(?:[\'’]\\p{L}+)*'
        const parent_font_style = {
            'line-height': hit_elem.css('line-height'),
            'font-size': '1em',
            'font-family': hit_elem.css('font-family')
        }
    
        const text_nodes = hit_elem.contents().filter(function(){
            return this.nodeType == Node.TEXT_NODE && XRegExp(word_re).test( this.nodeValue )
        })
    
        if (text_nodes.length == 0) {
            console.log('No text');
            return ''
        }
    
        const hit_text_node = getExactTextNode(text_nodes, e)
        if (!hit_text_node) {
            console.log('hit between lines')
            return ''
        }
  
        const hit_word = restorable(hit_text_node, function() {
            let hw = ''
    
            function getHitText(node, parent_font_style) {
                console.log('getHitText: \'' + node.textContent + '\'')
        
                if (XRegExp(word_re).test( node.textContent )) {
                    $(node).replaceWith(function() {
                        return this.textContent.replace(XRegExp('^(.{'+Math.round( node.textContent.length/2 )+'}(?:\\p{L}|[\'’](?=\\p{L}))*)(.*)', 's'), function($0, $1, $2) {
                            return '<transblock>'+escape_html($1)+'</transblock><transblock>'+escape_html($2)+'</transblock>'
                        })
                    })
        
                    $('transblock').css(parent_font_style)
        
                    const next_node = document.elementFromPoint(e.clientX, e.clientY).childNodes[0]
        
                    if (next_node.textContent == node.textContent) {
                        return next_node
                    }
                    else {
                        return getHitText(next_node, parent_font_style)
                    }
                }
                else {
                    return null
                }
            }
    
            const minimal_text_node = getHitText(hit_text_node, parent_font_style)
    
            if (minimal_text_node) {
                //wrap words inside text node into <transover> element
                $(minimal_text_node).replaceWith(function() {
                    return this.textContent.replace(XRegExp('(<|>|&|'+word_re+')', 'gs'), function ($0, $1) {
                    switch ($1) {
                    case '<': return '&lt;'
                    case '>': return '&gt;'
                    case '&': return '&amp;'
                    default: return '<transover>'+$1+'</transover>'
                    }
                    })
                })
        
                $('transover').css(parent_font_style)
        
                //get the exact word under cursor
                const hit_word_elem = document.elementFromPoint(e.clientX, e.clientY)
        
                //no word under cursor? we are done
                if (hit_word_elem.nodeName != 'TRANSOVER') {
                    console.log('missed!')
                }
                else  {
                    hw = $(hit_word_elem).text()
                    console.log('got it: \''+hw+'\'')
                }
            }
    
            return hw
        })
    
        return hit_word
	}
  
	const selection = window.getSelection()
	const hit_elem = document.elementFromPoint(e.clientX, e.clientY)
  
	// happens sometimes on page resize (I think)
	if (!hit_elem) {
	    return
	}
  
	//skip inputs and editable divs
	if (/INPUT|TEXTAREA/.test( hit_elem.nodeName ) || hit_elem.isContentEditable
		|| $(hit_elem).parents().filter(function() { return this.isContentEditable }).length > 0) {
  
	    return
	}
  
	let word = ''
	if (selection.toString()) {
        let sel_container = selection.getRangeAt(0).commonAncestorContainer
    
        while (sel_container.nodeType != Node.ELEMENT_NODE) {
            sel_container = sel_container.parentNode
        }
    
        if (
        // only choose selection if mouse stopped within immediate parent of selection
            ( $(hit_elem).is(sel_container) || $.contains(sel_container, hit_elem) )
            // and since it can still be quite a large area
            // narrow it down by only choosing selection if mouse points at the element that is (partially) inside selection
            && selection.containsNode(hit_elem, true)
            // But what is the point for the first part of condition? Well, without it, pointing at body for instance would also satisfy the second part
            // resulting in selection translation showing up in random places
        ) {
            word = selection.toString()
        } else {
            word = getHitWord(e)
        }
        console.log('Got selection: ' + word)
	} else {
		word = getHitWord(e)
    }
    console.log("word is: " + word);
	if (word != '') {
		chrome.extension.sendMessage({handler: 'translate', word: word}, function(response) { 
            try {
                const parsed = JSON.parse(response);
                if (!parsed.translation) {
                    return
                }

                const content = formatTranslation(parsed.translation)
                showTranslationPopup(e, content)
                last_mouse_stop.x = e.clientX
                last_mouse_stop.y = e.clientY
                toClipboard = parsed.translation
                //console.log("Translation: " + parsed.translation);
            }           
            catch(error) {
                console.log("Maybe extension is OFF")
            }
		})
	}
  }



// Function to ensure options are satisfied
function withOptionsSatisfied(e, do_stuff) {
	// TODO: Add options
	do_stuff();
};

// Click event on browser body
$(document).click(function(e) {
	withOptionsSatisfied(e, function() {
		process(e);
	})
});

// On Key pressed
$(document).keydown(function(e) {
    if (e.keyCode == 67 && e.ctrlKey && e.altKey) {
        const input = document.createElement('input')
        input.style.position = 'fixed'
        input.style.opacity = 0
        input.value = toClipboard
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
    }
});

/** Mouse event for remove trans-popup */
const last_mouse_stop = { x: 0, y: 0 }

function hasMouseReallyMoved(e) { // or is it a tremor?
    const left_boundry = parseInt(last_mouse_stop.x) - 15,
        right_boundry = parseInt(last_mouse_stop.x) + 15,
        top_boundry = parseInt(last_mouse_stop.y) - 15,
        bottom_boundry = parseInt(last_mouse_stop.y) + 15
        
    return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry || e.clientY < top_boundry
}

$(document).mousemove(function(e) {
    if (hasMouseReallyMoved(e)) {
        const mousemove_without_noise = new $.Event('mousemove_without_noise')
        mousemove_without_noise.clientX = e.clientX
        mousemove_without_noise.clientY = e.clientY

        $(document).trigger(mousemove_without_noise)
    }
})

// Context Menu
var last_e = '';
var toClipboard = '';

$(document).contextmenu(function(e) {
    last_e = e
})

$(document).scroll(function() {
    removePopup()
})

$(document).on('mousemove_without_noise', function(e) {
    removePopup()
})

/** Register Templates */
function registerTranslationComponent() {
    const html = 'trans_popup.html';
    const script = "trans_popup.js";

    const xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.extension.getURL(html), true);
    xhr.responseType = 'document';
    xhr.onload = function(e) {
        const doc = e.target.response;
        const template = doc.querySelector('template');        
        trans_popup = template;
    };
    xhr.send()

    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = chrome.extension.getURL(script);
    s.async = true;
    document.head.appendChild(s);
}

$(function() {
    registerTranslationComponent()
})

function isInputOrTextArea(e) {
    var val = 'false';    
    if ($(e.target).is("textarea,input[type=text]")) {
        val = 'true'
    }

    return val
}

function isDivEditable(e) {
    var val = 'false'
    var g = $(e.target).attr("g_editable")
    if (g == "true") {
        val = 'true'
    }

    return val
}

function replaceSelectedText(replacementText, e) {
    if (isInputOrTextArea(e) == 'true') {        
        var obj = e.target;
        var start = obj.selectionStart;
        var finish = obj.selectionEnd;
        var allText = obj.value;
        
        var sel = allText.substring(start, finish);
        var newText = allText.substring(0, start)+replacementText+allText.substring(finish, allText.length);
        obj.value = newText
    } else if (isDivEditable(e) == "true"){
        var sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(replacementText))
            }
        }    
    } else {
        console.log("No editable!!!")
    }
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.handler) {
        case 'contextMenusTranslate':
            var word = window.getSelection().toString()
            console.log("HEY: "+ word)
            if (word != '') {
                chrome.extension.sendMessage({handler: 'translate', word: word}, function(response) { 
                    try {
                        const parsed = JSON.parse(response);
                        if (!parsed.translation) {
                            return
                        }
                        
                        const content = formatTranslation(parsed.translation)
                        showTranslationPopup(last_e, content)
                        last_mouse_stop.x = last_e.clientX
                        last_mouse_stop.y = last_e.clientY
                        toClipboard = parsed.translation
                        
                        if (request.action == "replace") {
                            replaceSelectedText(parsed.translation, last_e)
                        }

                        console.log("Translation: " + parsed.translation);
                    }           
                    catch(error) {
                        console.log("Maybe extension is OFF")
                    }
                })
            }
            sendResponse({})     
            break
        default:
            console.error('Unknown handler')
            sendResponse("unknown handler")
	}
})