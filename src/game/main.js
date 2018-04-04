
import { Vec2, Rectangle } from './init.js';
import { Vec2, Rectangle } from './math.js';
import { IGraph, IRenderer } from './IRenderer.js';
import { engine, Graph } from './Engine.js';

import { GameStateManager } from './GameState.js';
import { SceneMap } from './Map.js';
//import { SceneCharacter } from './SceneCharacter.js';

import { EffectManager } from "./Skill.js";
import { } from "./MobSkill/238.FairyDust.js";

import { Client } from "../Client/Client.js";


import { SceneCharacter } from "./SceneCharacter.js";//debug
import gApp from "../app.js";//debug

window.REC_FRAME_MAX = 12;


window.SCREEN_PRINTLN = function (getText, getValue) {
	if (arguments.length == 2) {
		window._SCREEN_PRINTLN.push({ getText, getValue });
	}
	else if (arguments.length == 1) {
		window._SCREEN_PRINTLN.push(arguments[0]);
	}
}
window._SCREEN_PRINTLN = [];

var animationRequestID = null;

window.addEventListener("popstate", function (e) {
	GameStateManager.PopState(e.state);
});


///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////


/**
 * @param {KeyboardEvent} e
 */
window.onkeydown = function (e) {
	if (e.target != document.body) {
		return;
	}
	let k = e.key;

	if (k != null && !input_keys[k]) {
		input_keys[k] != null ? (++input_keys[k]) : (input_keys[k] = 1);
	}

	if (e.code == 'Space') {
		$("#m_is_run").click();
	}
	if (e.code == "F2") {
		m_editor_mode = !m_editor_mode;

		app.vue.editor_mode = m_editor_mode;
	}
}

window.onkeyup = function (e) {
	if (e.target != document.body) {
		return;
	}
	let k = e.key;

	if (k != null && input_keys[k]) {
		input_keys[k] = 0;
	}
}

Object.defineProperty(window, "$m_is_run", {
	get: function () {
		return $("#m_is_run").attr("checked");
	}, 
	set: function (value) {
		$("#m_is_run").attr("checked", !value);
		$("#m_is_run").click();
	}
});

/**
 * @param {MouseEvent} e
 */
window.onmousedown = function (e) {
	if (m_editor_mode) {
		if (!e.target.classList.contains("Editor")) {
			return;
		}
	}
	if (e.which == 1) {
		window.mouse_dl = 1;
		window.mouse_ul = 0;
	}
	else if (e.which == 2) {
		window.mouse_dm = 1;
		window.mouse_um = 0;
	}
	else if (e.which == 3) {
		window.mouse_dr = 1;
		window.mouse_ur = 0;
	}
	window.mouse_x = e.pageX;
	window.mouse_y = e.pageY;
}

/**
 * @param {MouseEvent} e
 */
window.onmouseup = function (e) {
	if (m_editor_mode) {
		if (!e.target.classList.contains("Editor")) {
			return;
		}
	}
	if (e.which == 1) {
		window.mouse_dl = 0;
		window.mouse_ul = 1;
	}
	else if (e.which == 2) {
		window.mouse_dm = 0;
		window.mouse_um = 1;
	}
	else if (e.which == 3) {
		window.mouse_dr = 0;
		window.mouse_ur = 1;
	}
	window.mouse_x = e.pageX;
	window.mouse_y = e.pageY;
}

/**
 * @param {MouseEvent} e
 */
window.onmousemove = function (e) {
	if (m_editor_mode) {
		if (!e.target.classList.contains("Editor")) {
			return;
		}
	}
	window.mouse_x = e.pageX;
	window.mouse_y = e.pageY;
	window.mouse_move = 1;
}

///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////


export class Game {
	constructor() {
		this.timer = 0;
		this.timer_ = 0;
		this._dTimer = 0;
		this.fps_arr = [];
		this.frame_s_arr = [];
		
		//this.chara = null;
		
		/** @type {SceneMap} */
		this.scene_map = new SceneMap();

		window.scene_map = this.scene_map;

		scene_map.onload = function () {
			GameStateManager.PushState(this, window.chara);
		}
		
		this.render = this.render.bind(this);
		
		document.getElementById("m_is_run").onchange = (function (e) {
			this.m_is_run = e.target.checked ? true : false;
			if (this.m_is_run) {
				animationRequestID = requestAnimationFrame(this.render);
				document.getElementById("Screenshot").innerHTML = "";
			}
		}).bind(this);

		this._$moveViewportSpeed = 10;//debug
	}
	
	moveViewport(inBound) {
		const scene_map = this.scene_map;

		const speed = input_keys['z'] ? (this._$moveViewportSpeed * 10) : this._$moveViewportSpeed;

		//m_viewRect = scene_map.viewArea(new Vec2(m_viewRect.left, m_viewRect.top));

		if (input_keys['ArrowLeft'] > 0) {
			m_viewRect.left -= speed;
		}
		if (input_keys['ArrowRight'] > 0) {
			m_viewRect.left += speed;
		}
		if (input_keys['ArrowUp'] > 0) {
			m_viewRect.top -= speed;
		}
		if (input_keys['ArrowDown'] > 0) {
			m_viewRect.top += speed;
		}

		let { left, top, right, bottom } = scene_map.mapBound;

		if (inBound) {
			if (m_viewRect.left < left) {
				m_viewRect.left = left;
			}
			if (m_viewRect.right > right) {
				m_viewRect.left = right - m_viewRect.width;
			}
			if (m_viewRect.top < top) {
				m_viewRect.top = top;
			}
			if (m_viewRect.bottom > bottom) {
				m_viewRect.top = bottom - m_viewRect.height;
			}
		}
	}
	
	async _$startClient() {
		if (scene_map) {
			if (window.io != null) {
				let client = new Client();
				gApp.client = client;
				client.$test();
			}
			else {
				let params = _parseUrlParameter();

				let map_id = params["map"] || "000000000";
				let chara_code = params["chara"] || "c,00002012,00012012,00026509|00026509,00034873|00034873,01051429,01072392";

				GameStateManager.PopState({
					map_id: map_id,
					chara: chara_code,
				});
			}
		}
	}

	/** @type {boolean} */
	get _isMapReady() {
		const scene_map = this.scene_map;
		return scene_map && scene_map.isLoaded();
	}
	
	async run() {
		console.log("begin render");
		this.render(0);//start render
	}
	
	async forceUpdateScreen() {
		const chara = this.chara;
		
		chara.renderer.__forceUpdate(0);
		
		if (this.m_is_run) {
			await chara.renderer.waitLoaded();
			chara.renderer.__require_update = true;//update once
			return;
		}
		await chara.renderer.waitLoaded();
		await chara.renderer._waitFrameTexturesLoaded();
		await IGraph.waitAllLoaded();
		
		document.getElementById("Screenshot").innerHTML = "";
		
		chara.renderer.__require_update = true;//update once
		
		this.render(0);
	}
	
	/**
	 * @param {DOMHighResTimeStamp} timeStamp
	 */
	render(timeStamp) {
		const scene_map = this.scene_map;

		if (this.m_is_run) {
			animationRequestID = requestAnimationFrame(this.render);
		}
		else {
			//async
			setTimeout(function () {
				let elem = new Image();
				elem.src = engine._canvas.toDataURL();
				engine.ctx.clearRect(0, 0, engine.ctx.width, engine.ctx.height);
				document.getElementById("Screenshot").appendChild(elem);
			}, 0);
		}
	////
		let stamp = timeStamp - this.timer;
		
		this.timer = timeStamp;
		
		try {
			if ((timeStamp - this.timer_) >= 1000) {
				if (this.fps_arr.length) {
					let sum = this.fps_arr.reduce(function (a, b) { return a + b; });
					let avg = sum / this.fps_arr.length;
					
					document.getElementById("FPS").innerHTML = avg.toFixed(2);
				}
				if (this.frame_s_arr.length) {
					let sum = this.frame_s_arr.reduce(function (a, b) { return a + b; });
					let avg = sum / this.frame_s_arr.length;
					
					document.getElementById("frame").innerHTML = avg.toFixed(2);
				}
				
				this.frame_s_arr = [];
				this.fps_arr = [];
				
				this.timer_ = timeStamp;
			}
			else if (stamp > 0 && Number.isFinite(stamp)) {
				this.fps_arr.push(1000 / stamp);
				this.frame_s_arr.push(stamp);
			}
		}
		catch (ex) {
			document.getElementById("FPS").innerHTML = "-";
			document.getElementById("frame").innerHTML = "-";
			this.fps_arr = [];
			this.frame_s_arr = [];
		}
	/////

		/** @type {SceneCharacter} */
		const chara = this.chara;

		/** @type {SceneCharacter[]} */
		const charaList = this.charaList;

		{
			for (let i in input_keys) {
				if (input_keys[i] > 0) {
					++input_keys[i];
				}
			}

			if (scene_map) {
				scene_map.update(stamp);//include world.update
			}

			SceneObjectMgr.Update(stamp);

			EffectManager.Update(stamp);

			// must before world.update
			for (let i = 0; i < charaList.length; ++i) {
				charaList[i].update(stamp);
			}
		}
		if ((timeStamp - this._dTimer) >= (1000 / (window.REC_FRAME_MAX || 20))) {
			this._dTimer = timeStamp;
			{
				let client = gApp.client;
				if (client && client.chara) {
					/** @type {SceneCharacter} */
					let ch = client.chara;
					ch.$recMove(window.$io);
				}
			}
		}
		//else {
		//	return;
		//}

	/////
		engine.beginScene();
		{
			engine.clearDrawScreen();
			engine.loadIdentity();
			//engine.color = [1, 1, 1, 1];
			
			m_viewRect.size = engine.screen_size;
			if (!m_editor_mode) {
				if (chara && chara.renderer) {
					m_viewRect.setCenter(chara.renderer.x, chara.renderer.y);
				}
				else if (scene_map.controller.player) {
					const pos = scene_map.controller.player.getPosition();
					const px = Math.trunc(pos.x * CANVAS_SCALE + 0.5);
					const py = Math.trunc(pos.y * CANVAS_SCALE + 0.5);
					m_viewRect.setCenter(px, py);
				}
			}
			
			if (m_is_rendering_map && this._isMapReady) {
				if (m_editor_mode) {
					this.moveViewport(false);
				}
				
				scene_map.beginRender(engine);
				{					
					scene_map.renderBackground(engine);
					if (0 && window.m_display_life && scene_map._raw.info.mirror_Bottom) {
						engine.ctx.setTransform(1, 0, 0, 1, 0, 0);
						engine.ctx.translate(Math.trunc(-m_viewRect.x), Math.trunc(-m_viewRect.y));
						engine.ctx.scale(1, -1);
						for (let i = 0; i < scene_map.layeredObject.length; ++i) {
							scene_map.renderLife(engine, i);
						}
					}
					for (let i = 0; i < scene_map.layeredObject.length; ++i) {
						scene_map.renderLayeredTile(engine, i);
						scene_map.renderLayeredObject(engine, i);
						
						scene_map.applyCamera(engine);
						{
							for (let chara_index = 0; chara_index < charaList.length; ++chara_index) {
								if (charaList[chara_index] == chara) {
									continue;
								}
								else if (charaList[chara_index].$layer == i) {
									charaList[chara_index].render(engine);
								}
							}

							if (window.m_display_life) {
								scene_map.renderLife(engine, i);
							}

							if (chara && chara.renderer) {
								if (chara.$layer == i) {
									chara.render(engine);
								}
							}
							
							SceneObjectMgr.RenderLayer(engine, i);
						}
					}
					scene_map.applyCamera(engine);
					{
						for (let i = scene_map.layeredObject.length; i < 12; ++i) {
							SceneObjectMgr.RenderLayer(engine, i);
						}
					}
				}
				scene_map.endRender(engine);
			}
			else {
				scene_map.applyCamera(engine);
				for (let i = 0; i < charaList.length; ++i) {
					charaList[i].render(engine);
				}
			}
			for (let i = 0; i < charaList.length; ++i) {
				charaList[i]._$drawName(engine);
			}
			for (let i = 0; i < charaList.length; ++i) {
				charaList[i]._$drawChatBalloon(engine);
			}
			
			if (m_is_rendering_map && this._isMapReady) {
				scene_map.beginRender(engine);
				{
					scene_map.applyCamera(engine);
					{
						if (window.m_display_portal) {
							scene_map.renderPortal(engine);
						}
					}
					
					scene_map.renderFrontground(engine);
				}
				scene_map.endRender(engine);

				if (window.m_display_particle_system) {
					scene_map.renderParticle(engine);
				}

				scene_map.applyCamera(engine);
				{
					EffectManager.Render(engine);

					if (m_display_debug_info) {
						/** @type {CanvasRenderingContext2D} */
						const ctx = engine.ctx;
						{
							ctx.beginPath();

							ctx.fillStyle = "white";
							ctx.fillRect(0, 0, 96, 50);

							ctx.fillStyle = "black";
							ctx.fillText("map origin", 5, 14, 96);

							ctx.fillText("view-x: " + m_viewRect.x.toFixed(0), 5, 30, 96);

							ctx.fillText("view-y: " + m_viewRect.y.toFixed(0), 5, 46, 96);
						}
					}

					scene_map.controller.render(engine);
				}
				engine.loadIdentity();
			}

			//print debug info
			if (m_display_debug_info) {
				if (this._isMapReady && scene_map.controller && scene_map.controller.player) {
					/** @type {CanvasRenderingContext2D} */
					const ctx = engine.ctx;

					const ta = ctx.textAlign, tb = ctx.textBaseline, lw = ctx.lineWidth;
					ctx.textBaseline = "top";
					ctx.lineWidth = 2.5;
					ctx.strokeStyle = "#000";
					let x = 400, y = 5;
					for (let line of window._SCREEN_PRINTLN) {
						const val = line.getValue();
						const text = line.getText();

						ctx.fillStyle = "#FFF";
						{
							ctx.textAlign = "right";
							ctx.strokeText(text, x - 2, y);
							ctx.fillText(text, x - 2, y);

							ctx.textAlign = "center";
							ctx.strokeText(":", x, y);
							ctx.fillText(":", x, y);

							ctx.textAlign = "left";
							ctx.strokeText(val, x + 2, y);
							ctx.fillText(val, x + 2, y);
						}

						if ("_val" in line) {
							let _val;
							if (line._val != val) {
								_val = line._val;//display new value
								line.__val = line._val;
								line._val = val;
							}
							else {
								_val = line.__val;//display old value
							}
							if (_val != val) {
								ctx.fillStyle = "#0FF";
							}

							ctx.fillStyle = "#FFF";
							{
								ctx.textAlign = "right";
								ctx.strokeText(text, x - 2 + 200, y);
								ctx.fillText(text, x - 2 + 200, y);

								ctx.textAlign = "center";
								ctx.strokeText(":", x + 200, y);
								ctx.fillText(":", x + 200, y);

								ctx.textAlign = "left";
								ctx.strokeText(_val, x + 2 + 200, y);
								ctx.fillText(_val, x + 2 + 200, y);
							}
						}
						else {
							line.__val = val;
							line._val = val;
						}

						y += 16;
					}
					ctx.textAlign = ta;
					ctx.textBaseline = tb;
					ctx.lineWidth = lw;
				}
			}
		}
		engine.endScene();
	}
	
	get chara() {
		return window.chara;
	}
	//set chara(value) {
	//	window.chara = value;
	//}

	get charaList() {
		return gApp.store.state.charaList;
	}
	
	get m_is_run() {
		return window.m_is_run;
	}
	set m_is_run(value) {
		window.m_is_run = value;
	}
}


///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

function _parseUrlParameter() {
	let sPageURL = decodeURIComponent(window.location.search.substring(1));
	let sURLVariables = sPageURL.split("&");
	let params = {};

	for (let i = 0; i < sURLVariables.length; ++i) {
		let sParameter = sURLVariables[i].split("=");

		params[sParameter[0]] = sParameter[1];
	}

	return params;
};

