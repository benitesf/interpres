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
            const parsed = JSON.parse(response);
			if (!parsed.translation) {
				return
			}
            console.log("Translation: " + parsed.translation);
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