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
var XD;
(function (XD) {
    var API = (function (_super) {
        __extends(API, _super);
        function API() {
            _super.apply(this, arguments);
        }
        var d = __define,c=API,p=c.prototype;
        API.init = function (jq) {
            // the API can only be initialized one time
            if (!API.initOnce)
                return;
            // bind all events to egret 
            var jqCanvas = jq("canvas");
            var jqDoc = jq(document);
            var jqWin = jq(window);
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
            jqWin.on('beforeunload', API.jqEventHandler);
            if (jqCanvas[0].addEventListener)
                jqCanvas[0].addEventListener("mousewheel", MouseWheelHandler, false),
                    jqCanvas[0].addEventListener("DOMMouseScroll", MouseWheelHandler, false); // Firefox
            else
                jqCanvas[0].attachEvent("onmousewheel", MouseWheelHandler); // IE 6/7/8
            function MouseWheelHandler(e) {
                var e = window.event || e;
                e.delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                API.jqEventHandler(e);
                return false;
            }
            API.initOnce = false;
            API.jq = jq;
            API.jqWin = jqWin;
        };
        API.jqEventHandler = function (event) {
            //event.preventDefault(); // MOUSE_DOWN_RIGHT
            event.typeEx = event.typeEx ? event.typeEx : event.type;
            var tLen = EventDispatcher.targets.length;
            for (var i = 0; i < tLen; i++) {
                var target = EventDispatcher.targets[i];
                var currentTarget = target;
                var visible = true;
                var scaleX = 1;
                var scaleY = 1;
                // the visible & scale can effect child DisplayObject
                while (!(currentTarget instanceof egret.Stage)) {
                    if (!currentTarget.visible)
                        visible = false;
                    scaleX *= currentTarget.scaleX;
                    scaleY *= currentTarget.scaleY;
                    currentTarget = currentTarget.parent;
                }
                var stagePos = target.localToGlobal(0, 0);
                var eLen = target["__"]["events"].length;
                var eventObj = {};
                eventObj.type = event.typeEx;
                eventObj.target = target;
                eventObj.stageX = stagePos.x;
                eventObj.stageY = stagePos.y;
                eventObj.stageWidth = API.jqWin.width();
                eventObj.stageHeight = API.jqWin.height();
                for (var j = 0; j < eLen; j++) {
                    if (target["__"]["events"][j]["type"] == event.typeEx) {
                        switch (event.typeEx) {
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
                                if (event.pageX < target.x * scaleX ||
                                    event.pageX > (target.x + target.width) * scaleX ||
                                    event.pageY < target.y * scaleY ||
                                    event.pageY > (target.y + target.height) * scaleY) {
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
                                if (!(event.pageX < target.x * scaleX ||
                                    event.pageX > (target.x + target.width) * scaleX ||
                                    event.pageY < target.y * scaleY ||
                                    event.pageY > (target.y + target.height) * scaleY)) {
                                    continue;
                                }
                                eventObj.stageMouseX = event.pageX;
                                eventObj.stageMouseY = event.pageY;
                                eventObj.mouseX = event.pageX - stagePos.x;
                                eventObj.mouseY = event.pageY - stagePos.y;
                                break;
                            case Event.MOUSE_WHEEL:
                                eventObj.wheelDelta = event.delta;
                                visible = true;
                                break;
                            case Event.KEY_PRESS:
                            case Event.KEY_DOWN:
                            case Event.KEY_UP:
                                eventObj.keyCode = event.which;
                                visible = true;
                                break;
                            case Event.STAGE_RESIZE:
                            case Event.STAGE_MOUSE_LEAVE:
                            case Event.STAGE_MOUSE_ENTER:
                            case Event.BROWSER_CLOSE:
                                visible = true;
                                break;
                        }
                        if (visible)
                            target["__"]["events"][j]["listener"].call(target["__"]["thisObj"], eventObj);
                    }
                }
                if (event.typeEx == Event.MOUSE_MOVE) {
                    if (event.pageX < target.x * scaleX ||
                        event.pageX > (target.x + target.width) * scaleX ||
                        event.pageY < target.y * scaleY ||
                        event.pageY > (target.y + target.height) * scaleY) {
                        if (target["__"]["mouseRollFlag"]) {
                            target["__"]["mouseRollFlag"] = false;
                            event.typeEx = Event.MOUSE_ROLLOUT;
                            API.jqEventHandler(event);
                        }
                    }
                    else {
                        if (!target["__"]["mouseRollFlag"]) {
                            target["__"]["mouseRollFlag"] = true;
                            event.typeEx = Event.MOUSE_ROLLOVER;
                            API.jqEventHandler(event);
                        }
                    }
                    break;
                }
            }
            switch (event.typeEx) {
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
        };
        API.initOnce = true;
        return API;
    }(egret.HashObject));
    XD.API = API;
    egret.registerClass(API,'XD.API');
    var Event = (function (_super) {
        __extends(Event, _super);
        function Event() {
            _super.apply(this, arguments);
        }
        var d = __define,c=Event,p=c.prototype;
        Event.MOUSE_ROLLOVER = "mouserollover";
        Event.MOUSE_ROLLOUT = "mouserollout";
        Event.MOUSE_MOVE_OUTSIDE = "mousemoveoutside";
        Event.MOUSE_DOWN_OUTSIDE = "mousedownoutside";
        Event.MOUSE_UP_OUTSIDE = "mouseupoutside";
        Event.MOUSE_MOVE = "mousemove";
        Event.MOUSE_CLICK = "click";
        Event.MOUSE_DOUBLE_CLICK = "dblclick";
        Event.MOUSE_UP = "mouseup";
        Event.MOUSE_DOWN_LEFT = "mousedown";
        Event.MOUSE_DOWN_RIGHT = "contextmenu";
        Event.MOUSE_WHEEL = "mousewheel";
        Event.KEY_PRESS = "keypress";
        Event.KEY_DOWN = "keydown";
        Event.KEY_UP = "keyup";
        Event.STAGE_MOUSE_LEAVE = "mouseleave";
        Event.STAGE_MOUSE_ENTER = "mouseenter";
        Event.STAGE_RESIZE = "resize";
        Event.BROWSER_CLOSE = "beforeunload";
        return Event;
    }(egret.HashObject));
    XD.Event = Event;
    egret.registerClass(Event,'XD.Event');
    var EventDispatcher = (function (_super) {
        __extends(EventDispatcher, _super);
        function EventDispatcher() {
            _super.apply(this, arguments);
        }
        var d = __define,c=EventDispatcher,p=c.prototype;
        EventDispatcher.addEventListener = function (target, type, listener, thisObj) {
            // initialize property __ to bind event to target
            target["__"] = target["__"] ? target["__"] : {};
            target["__"]["events"] = target["__"]["events"] ? target["__"]["events"] : [];
            // check if add same listener with same type or not
            var eLen = target["__"]["events"].length;
            for (var i = 0; i < eLen; i++)
                if (target["__"]["events"][i]["type"] == type && target["__"]["events"][i]["listener"] == listener)
                    return false;
            // add new event for target
            var event = {};
            event["type"] = type;
            event["listener"] = listener;
            target["__"]["events"].push(event);
            // bind thisObj
            target["__"]["thisObj"] = thisObj;
            // mouseRollOver & mouseRollOut status
            target["__"]["mouseRollFlag"] = null;
            // register event target
            var tLen = EventDispatcher.targets.length;
            for (var i = 0; i < tLen; i++)
                if (EventDispatcher.targets[i] == target)
                    return true;
            EventDispatcher.targets.push(target);
            return true;
        };
        EventDispatcher.hasEventListener = function (target, type) {
            if (!target["__"])
                return false;
            // check if the target have specified type or not
            var eLen = target["__"]["events"].length;
            for (var i = 0; i < eLen; i++)
                if (target["__"]["events"][i]["type"] == type)
                    return true;
            return false;
        };
        EventDispatcher.removeEventListener = function (target, type, listener) {
            if (!target["__"])
                return;
            // remove specified type and listener
            var eLen = target["__"]["events"].length;
            for (var i = 0; i < eLen; i++) {
                if (target["__"]["events"][i]["type"] == type && target["__"]["events"][i]["listener"] == listener) {
                    target["__"]["events"][i]["listener"] = null;
                    target["__"]["events"].splice(i, 1);
                    if (eLen == 1) {
                        target["__"]["events"] = null;
                        target["__"]["thisObj"] = null;
                        target["__"] = null;
                        delete target["__"];
                        // unregister event
                        var tLen = EventDispatcher.targets.length;
                        for (var j = 0; j < eLen; j++) {
                            if (EventDispatcher.targets[j] == target) {
                                EventDispatcher.targets.splice(j, 1);
                                break;
                            }
                        }
                    }
                    return true;
                }
            }
            return false;
        };
        EventDispatcher.removeAllEventListener = function (target) {
            if (!target["__"])
                return;
            // remove all event which bind to target
            var eLen = target["__"]["events"].length;
            for (var i = 0; i < eLen; i++)
                target["__"]["events"][0]["listener"] = null,
                    target["__"]["events"].shift();
            target["__"]["events"] = null;
            target["__"]["thisObj"] = null;
            target["__"] = null;
            delete target["__"];
            // unregister event
            var tLen = EventDispatcher.targets.length;
            for (var j = 0; j < eLen; j++) {
                if (EventDispatcher.targets[j] == target) {
                    EventDispatcher.targets.splice(j, 1);
                    break;
                }
            }
        };
        EventDispatcher.showAllAddedEventTypes = function (target) {
            if (!target["__"])
                return [];
            var eLen = target["__"]["events"].length;
            var types = [];
            for (var i = 0; i < eLen; i++)
                types.push(target["__"]["events"][i]["type"]);
            return types.filter(function (v, i, a) { return a.indexOf(v) === i; });
        };
        EventDispatcher.targets = [];
        return EventDispatcher;
    }(egret.HashObject));
    XD.EventDispatcher = EventDispatcher;
    egret.registerClass(EventDispatcher,'XD.EventDispatcher');
})(XD || (XD = {}));
//# sourceMappingURL=XDSDK.js.map