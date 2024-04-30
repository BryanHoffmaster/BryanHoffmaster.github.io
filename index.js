// TODO:
// * See if you need to do a "defer" before running the script or set it up to run at the end of the page.
// * Interactive CLI options via input element 
//    * build listeners to update the DOM and react to input element
//    * teardown listeners?
//    * Always pre-face input with CLI prompt
// * Read in document(s) and append content 
//    * Content should be displayed in the same order as the document
//    * Empty spaces are new paragraphs (update css p tags to accommodate)
//    * Apply the correct tags and classes to each paragraph and content

// NOTE: Inspired to do this from here: https://github.com/CodeNerve/CodeNerve.github.io/tree/master

var getFileText = async (file) => {
    try {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error('HTTP error, status =' + response.status);
        }

        const data = await response.text();
        return data

    } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
    }
}

// TODO: Clean this up and make more modular, this is the OG JS code you copied from.
var CLI_Display = {
    text: '',
    accessCountTimer: null,
    index: 0,
    speed: 2,
    file: '',
    accessCount: 0,
    deniedCount: 0,

    init: async () => {
        const fileText = await getFileText('BryanHoffmaster.txt');
        this.CLI_Display.text = fileText ?? '';
        this.CLI_Display.text = CLI_Display.text.slice(0, CLI_Display.text.length - 1);
        this.CLI_Display.updateLastCharacter();
    },
    // init: function () {
    //     accessCountTimer = setInterval(function () {
    //         CLI_Input.updateLastCharacter();
    //     }, 500);
    //     $.get(CLI_Input.file, function (data) {
    //         CLI_Input.text = data;
    //         CLI_Input.text = CLI_Input.text.slice(0, CLI_Input.text.length - 1);
    //     });
    // },

    // TODO: 
    content: ()=> {
        var content = document.getElementById('content');
        return content;
    },
    console: ()=> {
        var console = document.getElementById('console');
        return console;
    },

    display: ()=> {
        var display = document.getElementById('display');
        return display;
    },

    write: (str = '')=> {
        var cont = this.CLI_Display.content();
        cont.innerHTML = cont.append(str);
    },

    addText: function (key) {
        
        if (this.CLI_Display.text) {
            var cont = CLI_Display.content();
            if (cont.substring(cont.length - 1, cont.length) == '|')
                $('#console').html(
                    $('#console')
                        .html()
                        .substring(0, cont.length - 1),
                );
            if (key.keyCode != 8) {
                CLI_Display.index += CLI_Display.speed;
            } else {
                if (CLI_Display.index > 0) CLI_Display.index -= CLI_Display.speed;
            }
            var text = CLI_Display.text.substring(0, CLI_Display.index);
            var rtn = new RegExp('\n', 'g');

            $('#console').html(text.replace(rtn, '<br/>'));
            window.scrollBy(0, 50);
        }
    },

    getCLIPrompt: ()=> {
        return '<span class="cli-prompt">bryan.hoffmaster@HAL9000</span>:<span class="prompt-tilde">~</span><span class="prompt-dollar-sign">$</span>';
    },

    updateLastCharacter: ()=> {
        const content = this.CLI_Display.content();
        if(!content) console.error('Content is not defined in CLI_Display.updateLastCharacter');

        const contentText = content.innerHTML;

        if (contentText.substring(contentText.length - 1, contentText.length) == '|') {
            // you want to append the content contentText
            // should you pass the content to update with instead of checking here?
        } else {
            this.CLI_Display.console.innerHTML = '|'; // else write it
        }
            $('#console').html(
                $('#console')
                    .html()
                    .substring(0, contentText.length - 1),
            );
    },

    updateConsole: ()=> {
        // TODO: just make the cursor blink by it's own through the input?
        var console = document.getElementById('console');
        console.innerHTML = getCLIPrompt() + ' |';
    }
};


var consoleInputTicker = setInterval(function () {
    // TODO: hide the console input when writing out content!
    CLI_Display.updateConsole();
}, 300);

CLI_Display.speed = 300;
CLI_Display.file = 'BryanHoffmaster.txt';
CLI_Display.updateConsole();
CLI_Display.init();
consoleInputTicker();
