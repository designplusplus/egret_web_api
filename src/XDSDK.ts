//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2017-present, XDAPI Technology.
//  All rights reserved.
//  Author - Edwin Liang (Taiwan Taipei)
//  
//  [index.html]
//  1. include js as below:
//  <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
//  <script>$(function(){XD.API.init($)});</script>
//  2. change <div class=gret-player> properties
//  data-scale-mode="noScale"
//  data-frame-rate="60"
//  
//////////////////////////////////////////////////////////////////////////////////////
module XD {
    
    export class API extends egret.HashObject {

        private static initOnce:boolean = true;
        private static jq:any;
        public static jqWin:any;

        public static init(jq) {
            // the API can only be initialized one time
            if(!API.initOnce) return;
            // bind all events to egret 
            let jqCanvas = jq("canvas");
            let jqDoc = jq(document);
            let jqWin = jq(window);
            jqCanvas.mousemove(API.jqEventHandler);
            jqCanvas.click(API.jqEventHandler);
            jqCanvas.dblclick(API.jqEventHandler);
            jqCanvas.mouseup(API.jqEventHandler);
            jqCanvas.mousedown(API.jqEventHandler);
            jqCanvas.contextmenu(API.jqEventHandler);
            jqDoc.keypress(API.jqEventHandler);
            jqDoc.keydown(API.jqEventHandler);
            jqDoc.keyup(API.jqEventHandler);
            jqWin.mouseleave(API.jqEventHandler);
            jqWin.mouseenter(API.jqEventHandler);
            jqWin.resize(API.jqEventHandler);
            jqWin.on('beforeunload',API.jqEventHandler);
            if (jqCanvas[0].addEventListener)
                jqCanvas[0].addEventListener("mousewheel", MouseWheelHandler, false),        // IE9, Chrome, Safari, Opera
                jqCanvas[0].addEventListener("DOMMouseScroll", MouseWheelHandler, false);    // Firefox
            else jqCanvas[0].attachEvent("onmousewheel", MouseWheelHandler);                 // IE 6/7/8
            function MouseWheelHandler(e) {
                var e = window.event || e;
                e.delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                API.jqEventHandler(e);
                return false;
            }
            API.initOnce = false;
            API.jq = jq;
            API.jqWin = jqWin;
        }

        private static jqEventHandler(event:any):void {
            //event.preventDefault(); // MOUSE_DOWN_RIGHT
            event.typeEx = event.typeEx ? event.typeEx : event.type;
            let tLen:number = EventDispatcher.targets.length;
            for(let i = 0; i < tLen; i++) {
                let target:egret.DisplayObject = EventDispatcher.targets[i];
                let currentTarget:egret.DisplayObject = target;
                let scaleX:number = 1;
                let scaleY:number = 1;
                // the visible & scale can effect child DisplayObject
                while(!(currentTarget instanceof egret.Stage)) {
                    if(!currentTarget.visible) continue;
                    scaleX *= currentTarget.scaleX;
                    scaleY *= currentTarget.scaleY;
                    currentTarget = currentTarget.parent;
                }
                let stagePos:egret.Point = target.localToGlobal(0,0);
                let eLen:number = target["__"]["events"].length;
                let eventObj:any = {};
                eventObj.type = event.typeEx;
                eventObj.target = target;
                eventObj.stageX = stagePos.x;
                eventObj.stageY = stagePos.y;
                eventObj.stageWidth = API.jqWin.width();
                eventObj.stageHeight = API.jqWin.height();
                for(let j:number = 0; j < eLen; j++) {
                    if(target["__"]["events"][j]["type"] == event.typeEx) {
                        switch(event.typeEx) {
                            case Event.MOUSE_ROLLOVER:
                            case Event.MOUSE_ROLLOUT:
                                eventObj.stageMouseX = event.pageX;
                                eventObj.stageMouseY = event.pageY;
                                eventObj.mouseX = event.pageX - stagePos.x;
                                eventObj.mouseY = event.pageY - stagePos.y;
                                break;
                            case Event.MOUSE_MOVE:
                            case Event.MOUSE_CLICK:
                            case Event.MOUSE_DOUBLE_CLICK:
                            case Event.MOUSE_UP:
                            case Event.MOUSE_DOWN_LEFT:
                            case Event.MOUSE_DOWN_RIGHT:
                                if( event.pageX < target.x * scaleX ||
                                    event.pageX > (target.x + target.width) * scaleX ||
                                    event.pageY < target.y * scaleY ||
                                    event.pageY > (target.y + target.height) * scaleY ) {
                                    continue;
                                }
                                eventObj.stageMouseX = event.pageX;
                                eventObj.stageMouseY = event.pageY;
                                eventObj.mouseX = event.pageX - stagePos.x;
                                eventObj.mouseY = event.pageY - stagePos.y;
                                break;
                            case Event.MOUSE_MOVE_OUTSIDE:
                            case Event.MOUSE_UP_OUTSIDE:
                            case Event.MOUSE_DOWN_OUTSIDE:
                                if( !(event.pageX < target.x * scaleX ||
                                    event.pageX > (target.x + target.width) * scaleX ||
                                    event.pageY < target.y * scaleY ||
                                    event.pageY > (target.y + target.height) * scaleY) ) {
                                    continue;
                                }
                                eventObj.stageMouseX = event.pageX;
                                eventObj.stageMouseY = event.pageY;
                                eventObj.mouseX = event.pageX - stagePos.x;
                                eventObj.mouseY = event.pageY - stagePos.y;
                                break;
                            case Event.MOUSE_WHEEL:
                                eventObj.wheelDelta = event.delta;
                                break;
                            case Event.KEY_PRESS:
                            case Event.KEY_DOWN:
                            case Event.KEY_UP:
                                eventObj.keyCode = event.which;
                                break;
                            case Event.STAGE_RESIZE:
                            case Event.STAGE_MOUSE_LEAVE:
                            case Event.STAGE_MOUSE_ENTER:
                            case Event.BROWSER_CLOSE:
                                break;
                        }
                        target["__"]["events"][j]["listener"].call(target["__"]["thisObj"], eventObj);
                    }
                }
                if(event.typeEx == Event.MOUSE_MOVE) {
                    if( event.pageX < target.x * scaleX ||
                        event.pageX > (target.x + target.width) * scaleX ||
                        event.pageY < target.y * scaleY ||
                        event.pageY > (target.y + target.height) * scaleY ) {
                        if(target["__"]["mouseRollFlag"]) {
                            target["__"]["mouseRollFlag"] = false;
                            event.typeEx = Event.MOUSE_ROLLOUT;
                            API.jqEventHandler(event);
                        }
                    } else {
                        if(!target["__"]["mouseRollFlag"]) {
                            target["__"]["mouseRollFlag"] = true;
                            event.typeEx = Event.MOUSE_ROLLOVER;
                            API.jqEventHandler(event);
                        }
                    }
                    break;
                }
            }
            switch(event.typeEx) {
                case Event.MOUSE_MOVE:
                    event.typeEx = Event.MOUSE_MOVE_OUTSIDE;
                    API.jqEventHandler(event);
                    break;
                case Event.MOUSE_UP:
                    event.typeEx = Event.MOUSE_UP_OUTSIDE;
                    API.jqEventHandler(event);
                case Event.MOUSE_DOWN_LEFT:
                case Event.MOUSE_DOWN_RIGHT:
                    event.typeEx = Event.MOUSE_DOWN_OUTSIDE;
                    API.jqEventHandler(event);
                    break;
            }
            //return Event.BROWSER_CLOSE; 
        }

    }

    export class Event extends egret.HashObject {
        public static MOUSE_ROLLOVER:string = "mouserollover";
        public static MOUSE_ROLLOUT:string = "mouserollout";
        public static MOUSE_MOVE_OUTSIDE:string = "mousemoveoutside";
        public static MOUSE_DOWN_OUTSIDE:string = "mousedownoutside";
        public static MOUSE_UP_OUTSIDE:string = "mouseupoutside";
        public static MOUSE_MOVE:string = "mousemove";
        public static MOUSE_CLICK:string = "click";
        public static MOUSE_DOUBLE_CLICK:string = "dblclick";
        public static MOUSE_UP:string = "mouseup";
        public static MOUSE_DOWN_LEFT:string = "mousedown";
        public static MOUSE_DOWN_RIGHT:string = "contextmenu";
        public static MOUSE_WHEEL:string = "mousewheel";
        public static KEY_PRESS:string = "keypress";
        public static KEY_DOWN:string = "keydown";
        public static KEY_UP:string = "keyup";
        public static STAGE_MOUSE_LEAVE:string = "mouseleave";
        public static STAGE_MOUSE_ENTER:string = "mouseenter";
        public static STAGE_RESIZE:string = "resize";
        public static BROWSER_CLOSE:string = "beforeunload";
    }

    export class EventDispatcher extends egret.HashObject {

        public static targets:egret.DisplayObject[] = [];

        public static addEventListener(target:egret.DisplayObject, type:string, listener:Function, thisObj:any):boolean {
            // initialize property __ to bind event to target
            target["__"] = target["__"] ? target["__"] : {};
            target["__"]["events"] = target["__"]["events"] ? target["__"]["events"] : [];
            // check if add same listener with same type or not
            let eLen:number = target["__"]["events"].length;
            for(let i:number = 0; i < eLen; i++)
                if(target["__"]["events"][i]["type"] == type && target["__"]["events"][i]["listener"] == listener) return false;
            // add new event for target
            let event:any = {};
            event["type"] = type;
            event["listener"] = listener;
            target["__"]["events"].push(event);
            // bind thisObj
            target["__"]["thisObj"] = thisObj;
            // mouseRollOver & mouseRollOut status
            target["__"]["mouseRollFlag"] = null; 
            // register event target
            let tLen:number = EventDispatcher.targets.length;
            for(let i:number = 0; i < tLen; i++)
                if(EventDispatcher.targets[i] == target)
                    return true;
            EventDispatcher.targets.push(target);
            return true;
        }

        public static hasEventListener(target:egret.DisplayObject, type:string):boolean {
            if(!target["__"]) return false;
            // check if the target have specified type or not
            let eLen:number = target["__"]["events"].length;
            for(let i:number = 0; i < eLen; i++)
                if(target["__"]["events"][i]["type"] == type) return true;
            return false;
        }

        public static removeEventListener(target:egret.DisplayObject, type:string, listener:Function):boolean {
            if(!target["__"]) return;
            // remove specified type and listener
            let eLen:number = target["__"]["events"].length;
            for(let i:number = 0; i < eLen; i++) {
                if(target["__"]["events"][i]["type"] == type && target["__"]["events"][i]["listener"] == listener) {
                    target["__"]["events"][i]["listener"] = null;
                    target["__"]["events"].splice(i,1);
                    if(eLen == 1) {
                        target["__"]["events"] = null;
                        target["__"]["thisObj"] = null;
                        target["__"] = null;
                        delete target["__"];
                        // unregister event
                        let tLen:number = EventDispatcher.targets.length;
                        for(let j:number = 0; j < eLen; j++) {
                            if(EventDispatcher.targets[j] == target) {
                                EventDispatcher.targets.splice(j,1);
                                break;
                            }
                        }
                    }
                    return true;
                }
            }
            return false;
        }

        public static removeAllEventListener(target:egret.DisplayObject):void {
            if(!target["__"]) return;
            // remove all event which bind to target
            let eLen:number = target["__"]["events"].length;
            for(let i:number = 0; i < eLen; i++)
                target["__"]["events"][0]["listener"] = null,
                target["__"]["events"].shift();
            target["__"]["events"] = null;
            target["__"]["thisObj"] = null;
            target["__"] = null;
            delete target["__"];
            // unregister event
            let tLen:number = EventDispatcher.targets.length;
            for(let j:number = 0; j < eLen; j++) {
                if(EventDispatcher.targets[j] == target) {
                    EventDispatcher.targets.splice(j,1);
                    break;
                }
            }
        }

        public static showAllAddedEventTypes(target:egret.DisplayObject):string[] {
            if(!target["__"]) return [];
            let eLen:number = target["__"]["events"].length;
            let types:string[] = [];
            for(let i:number = 0; i < eLen; i++)
                types.push(target["__"]["events"][i]["type"]);
            return types.filter((v, i, a) => a.indexOf(v) === i);
        }

    }

    export class ColorComponent extends eui.Component {
        
    }

}