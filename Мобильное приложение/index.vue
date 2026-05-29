<template>
	<Head>
		<Title>оценивание территорий</Title>
	</Head>

    <div id="index" class="layout-vertical j-start a-center" v-reloadable>
		<user-reference />

		<main id="index-main" class="layout-vertical a-center">
			<div class="layout-vertical a-center">
				<callout v-if="!authenticated" class="margin-top" :icon="Icons['!']" colour="orange">
					Без авторизации вы можете заполнять чек&shy;листы,
					однако чтобы отправить их, необходимо войти в систему
					под своей учётной записью.
				</callout>

				<div class="index-list margin-top" v-tutorial="'index-list-checklists'">
					<h2>Чеклисты</h2>

					<section class="list-block" :class="checklists.draft ? '' : 'disabled'">
						<nuxt-link v-if="checklists.draft" to="/list?of=draft" id="list-draft">
							Черновики
						</nuxt-link>
						<p v-else id="list-draft">Черновики</p>
						<output for="list-draft">{{ checklists.draft }}</output>
					</section>

					<section class="list-block" id="list-filled" :class="checklists.filled ? '' : 'disabled'">
						<nuxt-link v-if="checklists.filled" to="/list?of=filled" id="list-filled">
							Заполненные
						</nuxt-link>
						<p v-else id="list-filled">Заполненные</p>
						<output for="list-filled">{{ checklists.filled }}</output>
					</section>

					<section class="list-block" id="list-sent" :class="checklists.sent ? '' : 'disabled'">
						<nuxt-link v-if="checklists.sent" to="/list?of=sent" id="list-sent">
							Отправленные
						</nuxt-link>
						<p v-else id="list-sent">Отправленные</p>
						<output for="list-sent">{{ checklists.sent }}</output>
					</section>
				</div>

				<button
					type="button"
					class="standalone-button index-main-button contrast-create"
					@click="showChecklist()"
					v-wave-on
					v-tutorial="'index-create'">

					Создать новый чеклист
				</button>

				<div class="index-list margin-top" v-tutorial="'index-list-history'">
					<h2>Объекты</h2>

					<section class="list-block" id="list-sent" :class="facilitiesHistory.created ? '' : 'disabled'">
						<nuxt-link v-if="facilitiesHistory.created" to="/facilities/edit?filter=created" id="list-create">
							Созданные
						</nuxt-link>
						<p v-else id="list-create">Созданные</p>
						<output for="list-create">{{ facilitiesHistory.created }}</output>
					</section>

					<section class="list-block" id="list-sent" :class="facilitiesHistory.updated ? '' : 'disabled'">
						<nuxt-link v-if="facilitiesHistory.updated" to="/facilities/edit?filter=updated" id="list-update">
							Изменённые
						</nuxt-link>
						<p v-else id="list-update">Изменённые</p>
						<output for="list-update">{{ facilitiesHistory.updated }}</output>
					</section>
				</div>

				<button
					type="button"
					class="standalone-button index-main-button contrast-create"
					@click="showFacility()"
					v-wave-on
					v-tutorial="'index-create-facility'">

					Создать новый объект
				</button>

				<nuxt-link
					to="/facilities/edit"
					v-wave-on
					class="standalone-button index-main-button pale-positive"
					v-tutorial="'index-facilities'">

					Редактирование объектов
				</nuxt-link>

				<div class="index-list margin-top" v-tutorial="'index-list-facilities'">
					<h2>Ожидает отправки в систему</h2>

					<section class="list-block" id="list-filled" :class="checklists.filled ? '' : 'disabled'">
						<nuxt-link v-if="checklists.filled" to="/list?of=filled" id="list-filled">
							Чеклисты
						</nuxt-link>
						<p v-else id="list-filled">Чеклисты</p>
						<output for="list-filled">{{ checklists.filled }}</output>
					</section>

					<section class="list-block" id="list-sent" :class="facilitiesDelayed.create ? '' : 'disabled'">
						<nuxt-link v-if="facilitiesDelayed.create" to="/facilities/delayed?to=create" id="list-create">
							Созданные объекты
						</nuxt-link>
						<p v-else id="list-create">Созданные объекты</p>
						<output for="list-create">{{ facilitiesDelayed.create }}</output>
					</section>

					<section class="list-block" id="list-sent" :class="facilitiesDelayed.update ? '' : 'disabled'">
						<nuxt-link v-if="facilitiesDelayed.update" to="/facilities/delayed?to=update" id="list-update">
							Изменённые объекты
						</nuxt-link>
						<p v-else id="list-update">Изменённые объекты</p>
						<output for="list-update">{{ facilitiesDelayed.update }}</output>
					</section>
				</div>

				<Hint identifier="index>help" />
			</div>

			<menu id="index-menu" class="standalone layout-vertical margin-top">
				<li v-tutorial="'index-manager'">
					<nuxt-link to="manager" v-wave-on class="standalone-button pale-positive">
						Установщик
					</nuxt-link>
				</li>

				<li v-tutorial="'index-settings'">
					<nuxt-link to="preferences" v-wave-on class="standalone-button pale-positive">
						Настройки приложения
					</nuxt-link>
				</li>

				<li v-tutorial="'index-feedback'">
					<button
						v-if="authenticated"
						type="button"
						v-wave-on
						class="standalone-button pale-positive"
						@click="showFeedback()">

						Оставить отзыв
					</button>

					<button
						v-else
						type="button"
						aria-disabled="true"
						class="standalone-button pale-generic"
						@click="context.$layer.alert('Для оставления отзыва необходимо авторизоваться')">

						<span class="main">Оставить отзыв</span>
					</button>
				</li>
			</menu>
		</main>

		<feedback-dialogue ref="feedbackModal" />
		<checklist-dialogue ref="checklistModal" @request-create="handleRequest" />
		<facility-dialogue ref="facilityModal" @delay="facilitiesDelayed.create ++" @create="facilitiesHistory.created ++" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { type NuxtApp, useNuxtApp } from "nuxt/app"

import { vWaveOn, vReloadable } from '~/public/vue/directives'
import { ChecklistManager } from '~/public/scripts/checklists'
import { Icons } from '~/public/assets'
import { FacilityDelayManager, FacilityListsManager, getChangeHistory } from 'public/scripts/facilities'

const context : { $auth: any, $layer: any, $tutorial: any } | NuxtApp = useNuxtApp() as any
const vTutorial = (context.$tutorial as any).vTutorial

// refs

const authenticated = ref<boolean>(context.$auth.isAuthenticated)
const feedbackModal = ref()
const checklistModal = ref()
const facilityModal = ref()

const checklists = ref({
	draft: 0,
	filled: 0,
	sent: 0
})

const facilitiesHistory = ref({
	created: 0,
	updated: 0
})

const facilitiesDelayed = ref({
	create: 0,
	update: 0
})

ChecklistManager.allSorted().then(data => {
	checklists.value.draft = data.draft.length
	checklists.value.filled = data.filled.length
	checklists.value.sent = data.sent.length
})

getChangeHistory().then(data => {
	facilitiesHistory.value.created = data.created.length
	facilitiesHistory.value.updated = data.updated.length
})

FacilityDelayManager.allSorted().then(data => {
	facilitiesDelayed.value.create = data.create.length
	facilitiesDelayed.value.update = data.update.length
})

// methods

function showFeedback () {
	if (!authenticated.value) return
	feedbackModal.value.show()
}

function showChecklist () {
	checklistModal.value.show()
}

function showFacility () {
	facilityModal.value.show()
}

function handleRequest () {
	setTimeout(() => facilityModal.value.show(), 100)
}

// definition

definePageMeta({
	name: 'index',
	layout: 'default',
})
</script>

<style scoped>
#index {
	gap                : 0;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	max-width          : 600px;
	height             : 100vh;
	margin             : 0 auto;
	overflow           : auto;
}

#index-main {
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100%;
	height             : auto;
	padding            : 20px;
}

.index-main-button {
	width     : 80%;
	padding   : 14px 20px;
	font-size : 110%;
}

.index-list {
	gap                : 14px;
	-webkit-box-sizing : border-box;
	-moz-box-sizing    : border-box;
	box-sizing         : border-box;
	width              : 100%;
	padding            : 14px 20px;
	border             : 3px solid var(--colour-ornate-indigo);
	border-radius      : 20px;
	background         : var(--colour-back);
	box-shadow         : 0 4px 2px 1px var(--colour-pale);
}

.list-block {
	display         : flex;
	flex-flow       : row nowrap;
	justify-content : space-between;
	align-items     : center;
	gap             : 10px;
	width           : 100%;
	margin-top      : 10px;
}

.list-block > :is(a, p) {
	display         : inline-block;
	color           : var(--colour-ornate-indigo);
	font-size       : 110%;
	font-weight     : bold;
	text-align      : left;
	text-transform  : lowercase;
	text-decoration : underline;
}
.list-block > :is(a, p):first-letter {
	text-transform: uppercase;
}

.list-block > output {
	display     : inline-block;
	color       : var(--colour-front);
	font-size   : 100%;
	text-align  : right;
	font-weight : bold;
}
.list-block > output::after {
	content     : ' ед.';
	color       : var(--colour-pale);
	font-weight : normal;
}

.list-block.disabled {
	opacity: .5;
}


#index-menu {
	gap     : 8px;
	padding : 20px;
}
#index-menu > li {
	width : 100%;
}
</style>
