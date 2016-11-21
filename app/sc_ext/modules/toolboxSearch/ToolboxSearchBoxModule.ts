/// <reference path='../../_all.ts'/>

namespace SitecoreExtensions.Modules.ToolboxSearchBox {
    declare var $xa: any;

    export class ToolboxSearchBoxModule extends ModuleBase implements ISitecoreExtensionsModule {

        constructor(name: string, description: string, rawOptions: Options.ModuleOptionsBase) {
            super(name, description, rawOptions);
        }

        canExecute(): boolean {
            if (window['$xa'] != undefined) {
                return $xa.toolbox != null;
            }
            return false;
        }

        initialize(): void {
            HTMLHelpers.postponeAction(_ => { return document.getElementById('sxa-toolbox-root-ul') != null; },
                _ => {
                    this.postponedInit();
                }, 1000, 10);
        }

        private postponedInit() {
            let toolbox = new SearchableToolbox();
        }
    }

    class Toolbox {
        protected renderings = new Array<SearchableToolboxRendering>();
        protected toolboxRenderingsList: HTMLUListElement;

        constructor() {
            this.toolboxRenderingsList = document.getElementById('sxa-toolbox-root-ul') as HTMLUListElement;
            this.bindRenderings();
        }

        private bindRenderings() {
            var sections = new Array<ToolboxSection>();
            [].forEach.call(this.toolboxRenderingsList.childNodes, (li) => {
                let sec = new ToolboxSection(li);
                sections.push(sec);
            });
            sections.forEach(s => { this.renderings = this.renderings.concat(s.renderings); });
        }
    }

    class SearchableToolbox extends Toolbox {
        protected fuzzy: Libraries.Fuzzy;
        private delayedSearch: any;

        constructor() {
            super();
            this.fuzzy = new Libraries.Fuzzy();
            this.injectSerachBox();
        }

        private getSearchResults(query: string): ToolboxSearchResult[] {
            var results = new Array<ToolboxSearchResult>();
            var i;

            if (query === '') {
                return [];
            }

            for (i = 0; i < this.renderings.length; i++) {
                var cmd = this.renderings[i];
                var f = this.fuzzy.getScore(cmd.name, query);
                results[i] = <ToolboxSearchResult> {
                    rendering: cmd,
                    score: f.score,
                    term: f.term,
                    highlightedTerm: f.highlightedTerm,
                };
            }
            results.sort(this.fuzzy.matchComparator);
            return results.slice(0, 5); // todo extract to options
        }

        private injectSerachBox() {
            let searchBox = this.createSearchBox();
            let clearSearch = this.createClearSearch();

            let container = this.createContainer();
            container.appendChild(searchBox);
            container.appendChild(clearSearch);

            var reference = this.toolboxRenderingsList;
            reference.parentNode.insertBefore(container, reference);
        }


        private createSearchBox(): HTMLInputElement {
            var input = HTMLHelpers.createElement<HTMLInputElement>('input', {
                id: 'sc-ext-toolbox-sb',
                type: 'text',
                placeholder: 'Search for renderings'
            });
            var data = this;
            input.onkeyup = (e: KeyboardEvent) => {
                clearTimeout(this.delayedSearch);
                this.delayedSearch = setTimeout(() => {
                    data.doSearch(e);
                }, 200);
            };
            return input;
        };

        private createContainer(): HTMLSpanElement {
            return HTMLHelpers.createElement<HTMLSpanElement>("span", { class: 'sc-ext-search-box-container' });
        }

        private createClearSearch(): HTMLSpanElement {
            let clearSpan = HTMLHelpers.createElement<HTMLSpanElement>("span", { class: 'sc-ext-search-box-clearer' });
            clearSpan.onclick = () => {
                return this.clearSearchBox();
            };
            return clearSpan;
        }

        private doSearch(e: KeyboardEvent): void {
            var phrase = (e.srcElement as HTMLInputElement).value;
            if (e && e.keyCode == 27) {
                phrase = "";
                this.clearSearchBox();

            } else {
                if (phrase.length > 0) {
                    this.startSearBoxMode();

                    let results = this.getSearchResults(phrase);
                    this.unFlagAllRenderings();
                    results.forEach((sr, index) => { sr.rendering.flag(index); });
                } else {
                    this.clearSearchBox();
                }
            }
        };

        private clearSearchBox() {
            let toolboxSearchBox = document.getElementById('sc-ext-toolbox-sb') as HTMLInputElement;
            toolboxSearchBox.value = "";
            this.unFlagAllRenderings();
            this.endSearBoxMode();
        }

        private startSearBoxMode() {
            this.toolboxRenderingsList.classList.add('sc-ext-search-box-enabled');
        }

        private endSearBoxMode() {
            this.toolboxRenderingsList.classList.remove('sc-ext-search-box-enabled');
        }

        private unFlagAllRenderings() {
            this.renderings.forEach(r => {
                r.unFlag();
            });
        }
    }

    class ToolboxSection {
        name: string;
        renderings = new Array<SearchableToolboxRendering>();
        private html: HTMLLIElement;

        constructor(li: HTMLLIElement) {
            this.html = li;
            this.name = (li.firstChild as HTMLSpanElement).innerHTML;

            [].forEach.call(li.lastChild.childNodes, (li) => {
                let sec = new SearchableToolboxRendering(li);
                this.renderings.push(sec);
            });
        }
    }

    class ToolboxRendering {
        name: string;
        protected html: HTMLLIElement;

        constructor(li: HTMLLIElement) {
            this.html = li;
            this.name = li.innerText;
        }
    }

    class SearchableToolboxRendering extends ToolboxRendering {
        constructor(li: HTMLLIElement) {
            super(li);
        }

        public flag(index: number) {
            this.html.classList.add('sc-ext-sb-hit');
            this.html.classList.add('result-' + index);
        }

        public unFlag() {
            this.html.classList.remove('sc-ext-sb-hit');
            this.removeClassByPrefix(this.html, "result-");
            this.html.classList.remove('sc-ext-sb-hit');
        }

        private removeClassByPrefix(el: HTMLElement, prefix: string): void {
            for (let index = 0; index < el.classList.length; index++) {
                var element = el.classList[index];
                if (element.match(new RegExp(prefix + '.*?', 'g'))) {
                    el.classList.remove(element);
                }
            }
        }
    }

    export class ToolboxSearchResult {
        rendering: SearchableToolboxRendering;
        score: number;
        term: string;
        highlightedTerm: string;
    }
}
