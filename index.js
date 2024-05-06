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

class CLI_Display {
    cli_input = null;
    prompt = null;
    prompt_wrapper = null;
    display = null;
    cli_output = null;
    currentParagraph = null;

    text = '';
    textLines = [];
    fileName = '';
    cursorBlinkRef = null;
    typingTimeout = null;

    constructor(entryFileName = '') {
        this.fileName = entryFileName;
        if (this.fileName) {
            this.init();
        }
    }


    loopTextLines = async () => {
        // TODO: IF you go the route of interactive console, this will probably need to become a promise
        // NOTE: You _cannot_ await functions one by one in a .forEach loop
        //       instead you need either a for..of loop or a Promise.all(array.map(line=> this.parseLine))
        for (const line of this.textLines) {
            await this.parseLine(line);
            this.prompt_wrapper.scrollIntoView({ behavior:'smooth', block: 'center' });
        }

        this.cli_input.addEventListener('keyup', this.handleInput);
        this.display.addEventListener('click', this.inputFocus);
        this.inputFocus(); // when all done, focus the input
    }

    parseLine = async (line) => {
        const hasPrompt = line.split(' ')[0] === '#@#';
        const hasLink = line.split(' ')[0].startsWith('$!link');
        const hasHeader = line.split(' ')[0].startsWith('###');

        if (hasLink) {
            await this.animateLinkText(line);
            return
        }

        if (hasPrompt) {
            await this.animatePromptText(line);
            return
        }

        if (hasHeader) {
            await this.animateHeaderText(line);
            return
        }

        // continue to type out lines as given
        this.hidePrompt()
        await this.appendNewParagraph();
        await this.typeOut(line, this.currentParagraph);
        this.showPrompt()
    }

    animateHeaderText = async (text) => {
        this.hidePrompt();
        const restOfLine = text.split(' ').slice(1).join(' ');
        await this.appendNewParagraph();
        this.currentParagraph.classList.add('bold');
        await this.typeOut(restOfLine, this.currentParagraph);
        this.showPrompt();
    }

    animatePromptText = async (text) => {
        const restOfLine = text.split(' ').slice(1).join(' ');
        await this.actionWait()
        this.stopCursorBlink();
        await this.typeOutInCLI_Input(restOfLine)
        await this.appendNewParagraph();
        this.cli_input.value = '';
        this.currentParagraph.innerHTML = this.getCLIPrompt() + restOfLine;
        this.startCursorBlink();
    }

    animateLinkText = async (line) => {
        this.hidePrompt();
        const linkHref = line.split(' ')[0].split('=').slice(1)
        const restOfLine = line.split(' ').slice(1).join(' ');
        await this.appendNewParagraph();
        const linkNode = this.buildLinkNode(linkHref);
        this.currentParagraph.appendChild(linkNode);
        await this.typeOut(restOfLine, linkNode);
        this.showPrompt();
    }

    hidePrompt = () => {
        if (this.prompt_wrapper) {
            this.prompt_wrapper.style.display = 'none';
        }
    }

    showPrompt = () => {
        if (this.prompt_wrapper) {
            this.prompt_wrapper.style.display = 'flex';
        }
    }

    setRefs = () => {
        this.cli_input = document.getElementById('cli_input');
        this.prompt = document.getElementById('prompt');
        this.prompt_wrapper = document.getElementById('prompt-wrapper');
        this.display = document.getElementById('display');
        this.cli_output = document.getElementById('cli_output');
    }

    getCLIPrompt = () => {
        return '<span class="cli-prompt">bryan.hoffmaster@HAL9000</span>:<span class="prompt-tilde">~</span><span class="prompt-dollar-sign">$</span>';
    }

    buildLinkNode = (href) => {
        var link = document.createElement('a');
        link.setAttribute('href', href);
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            window.open(e.target.href, '_blank');
        });
        return link;
    }

    appendNewParagraph = async () => {
        var newParagraph = document.createElement('p');
        this.cli_output.appendChild(newParagraph);
        this.currentParagraph = newParagraph;
    }

    typeOut = (text, node=null) => {
        return new Promise((resolve, reject) => {
            var i = 0;
            var timer = setInterval(() => {
                if (i < text.length) {
                    node.innerHTML += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, 1);
        });
    }

    typeOutInCLI_Input = (text) => {
        return new Promise((resolve, reject) => {
            var i = 0;
            var timer = setInterval((text2) => {
                if (i < text.length) {
                    this.cli_input.value += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });

    }

    startCursorBlink = () => {
        this.cursorBlinkRef = setInterval(function () {
            var input = this.cli_input;
            if (input.getAttribute('placeholder') == '|') {
                input.setAttribute('placeholder', '');
            } else {
                input.setAttribute('placeholder', '|');
            }
        }, 500);
    }

    stopCursorBlink = () => {
        this.cursorBlinkRef = clearInterval(this.cursorBlinkRef);
        this.cli_input.setAttribute('placeholder', '');
    }

    inputFocus = () => {
        this.stopCursorBlink();
        this.cli_input.focus();
    }
    
    actionWait = async (ms = 1500) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    handleInput = async (e) => {
        if (e.keyCode == 13) {
            await this.appendNewParagraph()
            await this.typeOut(this.cli_input.value, this.currentParagraph)
            this.cli_input.value = '';
            this.inputFocus()
            this.prompt_wrapper.scrollIntoView({ behavior:'smooth', block: 'center' });
        }
    }

    init = async () => {
        const fileText = await getFileText(this.fileName);
        this.text = fileText ?? '';
        this.textLines = this.text.split('\n');
        this.setRefs();
        this.startCursorBlink()
        await this.actionWait()

        if (this.textLines.length > 0) {
            this.loopTextLines();
        }
    }
};

// Wait til all content is loaded and then start the program off!
window.onload = () => {
    const display = new CLI_Display('BryanHoffmaster.txt');
}
