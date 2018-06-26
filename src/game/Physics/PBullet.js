﻿
import { Rectangle, Vec2 } from "../math.js";

import {
	PFilterHelper,
	b2Vec2,
	b2BodyType, b2BodyDef, b2FixtureDef,
	b2Body, b2Fixture,
	b2PolygonShape, b2CircleShape,
	b2Contact, b2Manifold,
	FixtureContactListener,
} from "./Physics.js";

import { World } from "./World.js";

import { PPlayer } from "./PPlayer.js";
import { SkillAnimation, SkillEffectAnimation } from "../Skill.js";

import { AttackInfo } from "../../Common/AttackInfo.js";

import { BaseSceneCharacter } from "../SceneCharacter.js";//?? SceneCharacter, SceneRemoteCharacter


export class PBullet {
	/**
	 * @param {PPlayer} owner
	 * @param {SkillAnimation} skillRenderer
	 * @param {SkillEffectAnimation} bulletRenderer
	 */
	constructor(owner, skillRenderer, bulletRenderer) {
		if (process.env.NODE_ENV === 'production') {
			if (!owner || !skillRenderer || !bulletRenderer) {
				debugger;
				alert("new PBullet(owner, skillRenderer)");
			}
		}

		/** @type {PPlayer} */
		this.owner = owner;

		/** @type {b2Body} */
		this.body = null;

		/** @type {SkillAnimation} */
		this.skillRenderer = skillRenderer;

		/** @type {SkillEffectAnimation} */
		this.bulletRenderer = bulletRenderer;

		/** @type {BaseBulletMoveFunc} */
		this.bulletMoveFunc = null;

		/** @type {-1|1} */
		this.front = 1;
	}

	/**
	 * @param {Partial<FixtureContactListener>=} listener
	 */
	_create(listener) {
		const world = this.owner.body.GetWorld();

		let bdef = new b2BodyDef();
		let fdef = new b2FixtureDef();
		let shape = new b2PolygonShape();

		const cx = (this.bulletRenderer.textures[0]._raw.__w * 0.5) / $gv.CANVAS_SCALE;
		const cy = (this.bulletRenderer.textures[0]._raw.__h * 0.5) / $gv.CANVAS_SCALE;

		let { x, y } = this.owner.body.GetWorldCenter();
		const front = this.owner.state.front;

		//TODO: set bullet position, front, angle

		bdef.type = b2BodyType.b2_kinematicBody;
		if (front > 0) {
			bdef.position.Set(x + cx, y);
		}
		else if (front < 0) {
			bdef.position.Set(x - cx, y);
		}
		else {//?? center position
			bdef.position.Set(x, y);
		}
		bdef.angle = 0;//???
		bdef.gravityScale = 0;
		bdef.allowSleep = false;
		bdef.bullet = true;
		bdef.fixedRotation = true;
		bdef.userData = this;

		this.body = world.CreateBody(bdef);

		shape.SetAsBox(cx, cy);//renderer origin is center
		
		//TODO: implement filter: player_bullet
		fdef.shape = shape;
		fdef.filter.loadPreset("default");//player_bullet
		//PFilterHelper.specialFilter(fdef.filter, ??);//remote player bullet (pvp)

		//fdef.loadPreset("default");
		fdef.userData = this;

		let fixture = this.body.CreateFixture(fdef);

		if (listener) {
			Object.keys(FixtureContactListener.prototype).forEach(key => fixture[key] = listener[key]);
		}
		else {
			fixture.preSolve = bullet_default_preSolve;
		}

		return this;
	}

	getPosition() {
		return this.body.GetPosition();
	}

	/**
	 * default is horizontal move front
	 * @param {BaseBulletMoveFunc=} bulletMoveFunc
	 * @param {number=} linearVelocityX - unit is meter
	 * @param {number=} linearVelocityY - unit is meter
	 */
	launch(bulletMoveFunc, linearVelocityX, linearVelocityY) {
		if (bulletMoveFunc) {
			this.bulletMoveFunc = bulletMoveFunc;
			//TODO: this.bulletMoveFunc.Step
			//TODO: this.bulletMoveFunc.AfterStep

			this.body.Step = bulletMoveFunc.Step.bind(bulletMoveFunc, this);
			this.body.AfterStep = bulletMoveFunc.AfterStep.bind(bulletMoveFunc, this);
		}
		else {
			this.body.m_linearVelocity.Set(linearVelocityX, linearVelocityY);

			if (process.env.NODE_ENV !== 'production') {
				this.body.AfterStep = () => {
					this.$tick = (this.$tick >>> 0) + 1;
					if (this.$tick > 600) {
						this.bulletRenderer.destroy();
						this.destroy();
					}
				};
			}
		}
	}

	destroy() {
		if (this.body) {
			this.body.m_world.DestroyBody(this.body);
			this.body = null;

			//this.bulletRenderer.destroy();
		}
	}
}

/**
 * @param {b2Contact} contact
 * @param {b2Manifold} oldManifold
 * @param {b2Fixture} fa
 * @param {b2Fixture} fb
 */
function bullet_default_preSolve(contact, oldManifold, fa, fb) {
	/** @type {PPlayer} */
	const targetPlayer = fb.m_userData;
	if (!targetPlayer) {
		return;
	}

	/** @type {BaseSceneCharacter} */
	const targetChara = targetPlayer.chara;//not implement yet
	if (!targetChara) {
		return;
	}

	/** @type {PBullet} */
	const that = fa.m_userData;
	
	/** @type {PPlayer} */
	let ownerPlayer = that.owner;

	////from self
	//if (ownerPlayer == targetPlayer) {
	//	return;
	//}

	/** @type {BaseSceneCharacter} */
	const ownerChara = ownerPlayer.chara;//not implement yet

	{
		/** @type {{skillId: number}} */
		const skillInfo = that.skillRenderer.data;//not implement yet

		//let attackDamage = ownerPlayer.stst.getAttackDamage();

		targetChara.damage(ownerChara, 123);
		targetChara.knockback(chara, 16, 16);

		//let atkInfo = new AttackInfo();
		//atkInfo.skill = skillInfo;
		//atkInfo.allDamage = targetChara.calcAllDamage();

		//let finalDamageList = CalcDamage.PDamage(ownerChara, atkInfo);//that.calcDamage

		//targetChara.damage(finalDamageList);

		//const damageFont = ownerChara.damageFont;

		//finalDamageList.forEach(dam => Scene.showDamage(dam.mob, damageFont, dam));
	}

	contact.SetEnabled(false);

	that.bulletRenderer.destroy();
	that.destroy();
}


/**
 * 子彈的移動方式
 */
export class BaseBulletMoveFunc {
	constructor() {
	}

	//TODO: base bullet move function

	/**
	 * @param {PBullet} bullet
	 */
	init(bullet) {
	}

	/**
	 * before update
	 * @param {PBullet} bullet
	 */
	Step(bullet) {
	}

	/**
	 * @param {PBullet} bullet
	 */
	afterStep(bullet) {
	}
}


	///**
	// * b2Vec2(meter) to Vec2 (pixel)
	// * @returns {Vec2}
	// */
	//getPosition() { }