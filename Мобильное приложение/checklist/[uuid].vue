<template>
	<Head>
		<Title>{{ stages[current] }} - {{ checklist?.name }} | оценивание территорий</Title>
	</Head>

	<div v-if="checklist === null" id="checklist-missing">
		<p>такого чеклиста не существует</p>
		<nuxt-link to="/">вернуться на главную</nuxt-link>
	</div>

	<div v-else-if="checklist" id="checklist" class="layout-vertical no-gap">
		<site-header ref="header" menubar :name="checklist.name" :subtitle="stages[current] ?? '-'">
			<section v-if="current !== 'begin' && current !== 'verification'" class="group-progress">
				<h3 class="progress-title">Прогресс заполнения</h3>

				<ol class="progress-content layout-vertical">
					<li
						v-for="fp in checklist.progressOf(Number(current)).fields"
						class="layout-horizontal a-center"
						:style="{
							'--local-filled': fp.filled,
							'--local-total': fp.total
						}"
						v-wave-on
						@click="goToField(fp)">

						<svg
							v-if="fp.filled === fp.total"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							class="progress-element-state filled"
							:viewBox="Icons.v.viewBox"
							v-html="Icons.v.pathD">
						</svg>
						<svg
							v-else-if="fp.filled === 0"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							class="progress-element-state empty"
							:viewBox="Icons.x.viewBox"
							v-html="Icons.x.pathD">
						</svg>
						<svg
							v-else
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							class="progress-element-state incomplete"
							:viewBox="Icons['~'].viewBox"
							v-html="Icons['~'].pathD">
						</svg>

						<svg
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							class="progress-element-type"
							:viewBox="Icons[fp.type].viewBox"
							v-html="Icons[fp.type].pathD">
						</svg>

						<span class="progress-element-name">{{ fp.name }}</span>

						<span
							v-if="[ 'list', 'branches' ].includes(fp.type)"
							class="progress-element-value">

							{{ fp.filled }} / {{ fp.total }}
						</span>
					</li>
				</ol>
			</section>
		</site-header>

		<main id="checklist-stages" class="expandable">
			<!-- BEGIN -->

			<section
				:style="{ transform: `translateX(${(0 - stageKeys.indexOf(current)) * 100 + '%'})` }"
				class="stage-container"
				role="tabpanel">

				<div class="stage-content layout-vertical begin" role="presentation" v-reloadable>
					<section class="regular-panel layout-vertical">
						<label class="panel-title" for="template-selector">Шаблон чеклиста</label>

						<p><b>Критерий:</b> {{ checklist.name }}</p>
						<p><b>Направление:</b> {{ checklist.info.direction }}</p>
						<template v-if="checklist.info.facilityType">
							<p><b>Тип объекта:</b> {{ checklist.info.facilityType.name }}</p>
						</template>
						<p>
							Состоит из <b>{{ checklist.info.groupsCount }}</b>
							раздел{{ plural(checklist.info.groupsCount,['а','ов','ов']) }}
						</p>
					</section>

					<section class="regular-panel layout-vertical">
						<label class="panel-title" for="territory-selector">Территория</label>
						<output id="territory-selector">{{ checklist.territory.name }}</output>

						<template v-if="!checklist.info.territoryBased">
							<label class="panel-title" for="facility-selector">Объект</label>
							<output id="facility-selector">{{ checklist.facility!.name }}</output>
						</template>
					</section>

					<section class="regular-panel layout-vertical">
						<label class="panel-title">Общие фотографии</label>

						<image-block
							class="checklist-field-images"
							@change="() => commonImagesProgress?.update()"
							:template="`/checklists/${checklist?.uuid}/common-{}.img`"
							:min="checklist?.configuration.commonPictures?.required"
							:max="checklist?.configuration.commonPictures?.allowed"/>

						<p v-if="(checklist?.configuration.commonPictures?.required ?? 0) > 0" class="message-missing">
							жёлтые ячейки с
							<span style="color: var(--colour-contrast-red);">*</span>
							обязательны
						</p>
					</section>

					<section v-if="!checklist.info.territoryBased" class="regular-panel layout-vertical">
						<label class="panel-title">Текущее состояние объекта</label>

						<textarea v-model="checklist.comment" class="standalone-textarea">
						</textarea>
					</section>

					<section v-else class="regular-panel layout-vertical">
						<label class="panel-title" for="territory-selector">Территория</label>

						<output class="standalone-input">{{ checklist.territory.name }}</output>

						<template v-if="!checklist.info.territoryBased">
							<label class="panel-title" for="facility-selector">Объект</label>

							<output id="cl-data-name" class="standalone-input">
								{{ checklist.facility ? checklist.facility.name : '' }}
							</output>
						</template>
					</section>
				</div>
			</section>

			<!-- BEGIN - TO - GROUPS -->

			<section
				v-for="(group, stage) in checklist.groups"
				:style="{ transform: `translateX(${((Number(stage) + 1) - stageKeys.indexOf(current)) * 100 + '%'})` }"
				class="stage-container"
				role="tabpanel">

				<div class="stage-content layout-vertical" role="presentation" v-reloadable>
					<callout v-if="group.note" :colour="'cyan'">
						<b>Пояснения:</b><br /><br />
						{{ group.note }}
					</callout>

					<Field
						v-for="field in group.fields"
						:field="field"
						:config="checklist.configuration" />

					<template v-for="gp in [ checklist?.progressOf(stage) ]">
						<progress-panel
							:name="`Прогресс заполнения`"
							:value="gp.progress"
							:progress="gp.filled / gp.total"
							:note="
							gp.filled < gp.total ?
								`Заполните ещё ${gp.total - gp.filled} ` +
								`пол${plural(gp.total - gp.filled, ['е','я','ей'])} ` :
								null
						"/>
					</template>

					<Hint identifier="cl>progress" />
				</div>
			</section>

			<!-- GROUPS - TO - VERIFICATION -->

			<section
				:style="{ transform: `translateX(${(stageKeys.length - 1 - stageKeys.indexOf(current)) * 100 + '%'})` }"
				class="stage-container"
				role="tabpanel">

				<div class="stage-content layout-vertical" role="presentation" v-reloadable>
					<div class="stage-progress-block layout-vertical">
						<h2 class="stage-progress-title">Общие сведения</h2>

						<progress-panel
							v-if="checklist.territory"
							:name="'Территория выбрана'"
							:value="`да <span>(${checklist.territory.name})</span>`"
							:progress="1"/>
						<progress-panel
							v-else
							:name="'Территория выбрана'"
							:value="'нет'"
							:progress="0"
							:note="'Выберите территорию в разделе «общие сведения»'"
							@click="current = 'begin'"/>

						<template v-if="!checklist.info.territoryBased">
							<progress-panel
								v-if="checklist.facility"
								:name="`Объект выбран`"
								:value="`да <span>(${checklist.facility.name})</span>`"
								:progress="1"/>
							<progress-panel
								v-else
								:name="`Объект выбран`"
								:value="'нет'"
								:progress="0"
								:note="'Выберите объект в разделе «общие сведения»'"
								@click="current = 'begin'"/>
						</template>

						<async-progress-panel
							ref="commonImagesProgress"
							:name="`Общие изображения загружены`"
							:raw="async () => await checklist?.imagesUploaded()"
							:progress="checklistImages.progress"
							:value="checklistImages.value"
							:note="checklistImages.note"
							@click="current = 'begin'"/>

						<template v-if="!checklist.info.territoryBased">
							<progress-panel
								v-if="checklist.comment"
								:name="'Комментарий написан'"
								:value="`да <span>(${checklist.comment.length} симво${plural(checklist.comment.length, ['л','ла','в'])})</span>`"
								:progress="1"/>
							<progress-panel
								v-else
								:name="'Комментарий написан'"
								:value="'нет'"
								:progress="0"
								:note="'Заполните текущее состояние объекта в разделе «общие сведения»'"
								@click="current = 'begin'"/>
						</template>
					</div>

					<div class="stage-progress-block layout-vertical">
						<h2 class="stage-progress-title">Разделы</h2>

						<template v-for="(group, index) in checklist?.detailedProgress()" :key="index">
							<progress-panel
								:name="`Заполнение раздела «${group.name}»`"
								:value="group.progress"
								:progress="group.filled / group.total"
								:note="
									group.filled < group.total ?
										`Заполните ещё ${group.total - group.filled} ` +
										`пол${plural(group.total - group.filled, ['е','я','ей'])} ` +
										`из ${group.total} в разделе «${group.name}»` :
										null
								"
								@click="
									group.filled < group.total ? current = index.toString() : () => true
								"/>
						</template>

						<br />

						<template v-for="progress in [ checklist?.progress() ]">
							<progress-panel
								:name="`Итого`"
								:value="progress.progress"
								:progress="progress.filled / progress.total"
								:note="
									progress.filled < progress.total ?
										`Заполните ещё ${progress.total - progress.filled} ` +
										`пол${plural(progress.total - progress.filled, ['е','я','ей'])} ` :
										null
								"/>
						</template>
					</div>

					<div class="stage-progress-block layout-vertical">
						<h2 class="stage-progress-title">Прочее</h2>

						<progress-panel
							v-if="authenticated"
							:name="'Пользователь авторизован'"
							:value="'да'"
							:progress="1"/>
						<progress-panel
							v-else
							:name="'Пользователь авторизован'"
							:value="'нет'"
							:progress="0"
							:note="'Авторизуйтесь в меню справа сверху для отправки'"
							@click="router.push({ name: 'profile' })"/>

						<progress-panel
							v-if="connected"
							:name="'Есть подключение к интернету'"
							:value="'да'"
							:progress="1"/>
						<progress-panel
							v-else
							:name="'Есть подключение к интернету'"
							:value="'нет'"
							:progress="0"
							:note="'Подключитесь к интернету для отправки'"/>
					</div>

					<div v-if="!checklist.sent" class="stage-progress-block layout-vertical">
						<h2 class="stage-progress-title">Отправка</h2>

						<callout
							v-if="!checklist?.filled"
							:icon="Icons['!']"
							colour="red">

							Вы пока не заполнили всё, что требуется для отправки.
							Проверьте, чтобы в блоках сверху везде было "да" или "100%" и
							выполните указанное в тексте внизу блоков, где это не так.
						</callout>

						<section v-else class="regular-panel layout-vertical">
							<h3 class="panel-title">Подтверждение</h3>

							<div class="layout-horizontal">
								<input
									type="checkbox"
									name="remember"
									id="send-ready"
									class="checkbox-input"
									:checked="checklist.signed"
									@change="checklist.sign(($event.target as unknown as HTMLInputElement).checked)"/>

								<label for="send-ready" class="checkbox-label">
									Подтверждаю, что чеклист готов к отправке
								</label>
							</div>

						</section>

						<section v-if="checklist.signed" class="regular-panel layout-vertical">
							<h3 class="panel-title">Отправка</h3>

							<button
								type="button"
								class="standalone-button contrast-positive"
								@click="tryExport">

								Отправить в систему
							</button>
						</section>

						<Hint identifier="cl>send" />
					</div>

					<callout v-else :icon="Icons['v']" colour="green">
						Чеклист заполнен и уже был отправлен на сервер. Спасибо за работу.
					</callout>
				</div>
			</section>

			<!-- VERIFICATION - END -->
		</main>

		<footer class="stage-navigation layout-horizontal a-stretch complementary-block">
			<button
				v-if="current !== 'begin'"
				type="button"
				class="navigation-button left contrast-positive"
				v-wave-on
				@click="goBack">

				<svg
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
					:viewBox="Icons.arrowW.viewBox"
					v-html="Icons.arrowW.pathD">
				</svg>
				<span>назад</span>
			</button>
			<nuxt-link v-else to="/" class="navigation-button left contrast-update" v-wave-on>
				<Icon source="arrowW" />
				<span>меню</span>
			</nuxt-link>

			<Dropdown
				v-tutorial="'checklist-progress'"
				class="stage-selector"
				:style="{ '--local-stage': stageKeys.indexOf(current), '--local-all': stageKeys.length - 1 }"
				v-model="current"
				:options="stageKeys.map(s => ({ id: s, name: stages[s] }))"
				quick/>

			<button
				type="button"
				class="contrast-positive navigation-button right"
				v-wave-on
				:disabled="current === 'verification'"
				@click="goNext">

				<span>далее</span>
				<Icon source="arrowE" />
			</button>
		</footer>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { type NuxtApp, useNuxtApp } from "nuxt/app"
import type { Territory } from 'public/scripts/types'

import { vWaveOn, vReloadable } from "public/vue/directives"
import { ChecklistManager, Checklist } from '~/public/scripts/checklists'
import { Icons } from "~/public/assets"
import { Cache } from "~/public/scripts/storage"
import { Network } from "public/scripts/environment"
import { plural } from "~/public/scripts/utils"
import { getTerritories } from "public/scripts/api"

const context : { $auth: any, $layer: any, $tutorial: any } | NuxtApp = useNuxtApp() as any
const route : any = useRoute()
const router : any = useRouter()
const vTutorial = (context.$tutorial as any).vTutorial

// refs

const stages = ref<Record<string, string>>({
	begin: 'Общие сведения',
	verification: 'Сводка и отправка',
})
const stageKeys = ref<Array<string>>(Object.keys(stages.value))
const current = ref<string>(route.query.stage || 'begin')

const checklist = ref<Checklist|null|undefined>()

const header = ref<any>()

const territories = ref<Territory[]>([])

const connected = ref<boolean>(true)
Network.isConnected().then(con => { connected.value = con })

const commonImagesProgress = ref<any>()

// computed

const authenticated = computed<boolean>(() => context.$auth.user !== null)

// watchers

watch(current, () => {
	history.replaceState(history.state, '', `?stage=${current.value}`)
	Cache.write(`checklist-${checklist.value?.uuid}-stage`, current.value)

})
Network.listen((con: boolean) => { connected.value = con })

// hooks

ChecklistManager.load(route.params.uuid as string).then(cl => {
	checklist.value = cl

	if (cl !== null) {
		stageKeys.value = [ 'begin' ]

		for (let i = 0; i < cl.groups.length; i ++) {
			stages.value[i] = `${i+1}. ${cl.groups[i].name}`
			stageKeys.value.push(i.toString())
		}

		stageKeys.value.push('verification')

		Cache.read(`checklist-${cl.uuid}-stage`).then(stage => {
			if (stage) current.value = stage.toString()
		})
	}
})

onMounted(async () => {
	let options = await getTerritories()

	let assignments : Record<number, string> = {}

	if (context.$auth.user) {
		for (let role of context.$auth.user.rolesOnTerritories ?? []) {
			if (role.territory) assignments[role.territory.id] = role.territory.name
		}
	}

	for (let option of options) {
		// @ts-ignore
		if (assignments[option.id]) option.subtitle = 'У вас есть назначение здесь'
	}

	territories.value = options
})

// methods

const checklistImages = {
	progress (v : number) : number {
		let required = checklist.value?.configuration?.commonPictures?.required ?? 0
		if (v >= required) return 1
		else return v / required
	},
	value (v : number) : string {
		let required = checklist.value?.configuration?.commonPictures?.required ?? 0
		if (v >= required) return `да <span>(${v} изображени${plural(v, ['е','я','й'])})</span>`
		else return 'нет'
	},
	note (v : number) : string {
		let required = checklist.value?.configuration?.commonPictures?.required ?? 0
		if (v >= required) return ''
		else return `Должно быть загружено хотя бы ${required}, сейчас ${v}`
	},
}


function goNext () {
	current.value = stageKeys.value[stageKeys.value.indexOf(current.value) + 1] ?? 'verification'
}
function goBack () {
	current.value = stageKeys.value[stageKeys.value.indexOf(current.value) - 1] ?? 'begin'
}

function goToField (fp: { unique: string }) {
	document.getElementById(fp.unique)?.scrollIntoView({ behavior: 'smooth' })
	header.value.close()
}

function tryExport () {
	if (!checklist.value) return
	if (checklist.value.signed) router.push(`/send/${checklist.value.uuid}`)
}

// definition

definePageMeta({
	name: "checklist-uuid",
	layout: 'default',
})
</script>


<style scoped>
#checklist-missing {
	display            : flex;
	flex-direction     : column;
	flex-wrap          : nowrap;
	justify-content    : center;
	align-items        : center;
	gap                : 20px;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100vw;
	min-width          : 100vw;
	max-width          : 100vw;
	height             : 100vh;
	min-height         : 100vh;
	max-height         : 100vh;
	padding            : 40px;
	color              : var(--colour-pale);
	font-size          : 24px;
	text-align         : center;
}


#checklist {
	width      : 100vw;
	min-width  : 100vw;
	max-width  : 100vw;
	height     : 100vh;
	min-height : 100vh;
	max-height : 100vh;
	overflow   : hidden;
}

#checklist-stages {
	width : 100%;
	position: relative;
}

.stage-container {
	position    : absolute;
	left        : 0;
	top         : 0;
	width       : 100%;
	height      : 100%;
	overflow    : hidden;
	transition  : transform .3s;
	will-change : transform;
}

.stage-content {
	gap                : 40px;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100%;
	height             : 100%;
	padding            : 10px 10px 30px 10px;
	overflow           : auto;
}
.stage-content.begin {
	gap : 20px;
}


.stage-navigation {
	gap                : 4px;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100%;
	min-width          : 100%;
	max-width          : 100%;
	padding            : 4px 6px;
	border-top         : 2px solid var(--colour-contrast-info-back);
	overflow           : hidden;
}

.navigation-button {
	display         : flex;
	flex-shrink     : 0;
	flex-direction  : row;
	flex-wrap       : nowrap;
	justify-content : flex-start;
	align-items     : center;
	gap             : 4px;
	padding         : 6px;
	text-decoration : none;
}
.navigation-button > svg {
	width      : 24px;
	min-width  : 24px;
	max-width  : 24px;
	height     : 24px;
	min-height : 24px;
	max-height : 24px;
}

.navigation-button.left {
	padding-left  : 4px;
	padding-right : 8px;
	border-radius : 12px 0 0 12px;
}

.navigation-button.right {
	padding-left  : 8px;
	padding-right : 4px;
	border-radius : 0 12px 12px 0;
}

.stage-selector {
	flex: 1;
}
.stage-selector > :deep(.representation) {
	background: linear-gradient(
		to right,
		var(--colour-pale) 0%,
		var(--colour-pale) calc(var(--local-stage) / var(--local-all) * 100%),
		var(--colour-element) calc(var(--local-stage) / var(--local-all) * 100%),
		var(--colour-element) 100%
	);
	text-shadow: 0 0 4px var(--colour-back);
	text-align: center;
}

.stage-selector, /* TODO make it pretty somehow */
.stage-selector > :deep(.representation),
.stage-selector > :deep(.representation > .dropdown-option-text),
.stage-selector > :deep(.representation > .dropdown-option-text > .dropdown-option-name) {
	width         : 100%;
	overflow      : hidden;
	text-overflow : ellipsis;
	white-space   : nowrap;
}


.group-progress {
	width : 100%;
}

.progress-title {
	display            : block;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100%;
	padding            : 4px 8px;
	margin-bottom      : 4px;
	background         : var(--colour-contrast-info-back);
	color              : var(--colour-contrast-info-fore);
}

.progress-content {
	gap                : 4px;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100%;
	max-height         : 60vh;
	padding            : 4px;
	overflow           : auto;
	list-style         : none;
}

.progress-content > li {
	gap: 2px;
	-webkit-box-sizing: border-box;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
	width: 100%;
	padding: 2px 4px;
	background: linear-gradient(
		to right,
		var(--colour-pale-positive-back) 0%,
		var(--colour-pale-positive-back) calc(var(--local-filled) / var(--local-total) * 100%),
		var(--colour-pale-negative-back) calc(var(--local-filled) / var(--local-total) * 100%),
		var(--colour-pale-negative-back) 100%
	);
	box-shadow: 0 0 3px 0 var(--colour-pale);
	position: relative;
}
.progress-content > li::after {
	content           : '';
	position          : absolute;
	right             : 0;
	top               : 0;
	width             : calc(100% - var(--local-filled) / var(--local-total) * 100%);
	height            : 100%;
	background        : url('/images/texture.png');
	background-repeat : repeat;
	background-size   : 40px;
	opacity           : 0.1;
}
.progress-content > li > * {
	position : relative;
	z-index  : 1;
}

.progress-element-state {
	width      : 24px;
	min-width  : 24px;
	max-width  : 24px;
	height     : 24px;
	min-height : 24px;
	max-height : 24px;
}

.progress-element-state.filled     { fill: var(--colour-contrast-positive-back); }
.progress-element-state.empty      { fill: var(--colour-contrast-negative-back); }
.progress-element-state.incomplete { fill: var(--colour-contrast-warning-back); }

.progress-element-type {
	width      : 20px;
	min-width  : 20px;
	max-width  : 20px;
	height     : 20px;
	min-height : 20px;
	max-height : 20px;
	fill       : var(--colour-pale);
}


.progress-element-name {
	flex          : 1;
	white-space   : nowrap;
	overflow      : hidden;
	text-overflow : ellipsis;
	font-size     : 90%;
}
.progress-element-value {
	font-size   : 90%;
	font-weight : bold;
}


.stage-progress-title {
	display            : block;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100%;
	padding            : 10px 20px;
	background         : var(--gradient-heading);
	color              : var(--colour-front);
	font-size          : 120%;
	text-align         : center;
}
</style>
