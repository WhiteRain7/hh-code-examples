<template>
    <div id="admin-container">
        <AdminHeader
            :route="[
                {
                    name: 'Настройки ИС',
                    path: '/admin/cabinet',
                    choices_preset: 'admin',
                },
                {
                    name: 'Опросы',
                    path: '/admin/survey',
                },
                {
                    name: survey.name,
                    path: '#',
                },
            ]"
            :site_link="`/all?of=surveys&open=${survey.id}`"
            :allowedModes="{
                view: true,
                edit: () => [ 'draft', 'template' ].includes(survey.status.id) && (user.can.updateAny.survey || user.can.updateOwn.survey)
            }"
            :modes="{
                view: 'Просмотр',
                edit: 'Изменение',
            }"
            :start-mode="mode"
            @mode="mode = $event" />


        <div id="admin-main">
            <AdminNavigation :actions="[
                {
                    title: 'Инфографика',
                    icon: 'M120-120v-80l80-80v160h-80Zm160 0v-240l80-80v320h-80Zm160 0v-320l80 81v239h-80Zm160 0v-239l80-80v319h-80Zm160 0v-400l80-80v480h-80ZM120-327v-113l280-280 160 160 280-280v113L560-447 400-607 120-327Z',
                    style: 'purple',
                    action: openAnalytics,
                    skip: () => survey.status.id === 'draft' || survey.status.id === 'template' || !user.can.viewAnalytics.survey
                },
                {
                    title: 'Добавить раздел',
                    icon: 'M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z',
                    style: 'green',
                    action: addChapter,
                    skip: () => mode !== 'edit'
                },
                {
                    title: 'Превратить в шаблон',
                    icon: 'M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v240h-80v-200H520v-200H240v640h360v80H240Zm638 15L760-183v89h-80v-226h226v80h-90l118 118-56 57Zm-638-95v-640 640Z',
                    style: 'purple',
                    action: convertToTemplate,
                    skip: () => mode !== 'edit' || survey.status.id !== 'draft'
                },
                {
                    title: 'Удалить',
                    icon: 'M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z',
                    style: 'red',
                    action: remove,
                    skip: () => !user.owns('survey:delete', survey.createdBy) || survey.isFixed
                }
            ]"/>

            <main class="admin-body">
                <section class="admin-panel size-full">
                    <h2 class="admin-panel-title hidden">Описание и рекомендации к заполнению опроса</h2>

                    <div class="admin-table-container">
                        <table class="admin-table">
                            <caption>{{ survey.name }} / {{ survey.status.name }}</caption>

                            <colgroup>
                                <col />
                                <col style="width: 160px;" />
                                <col style="width: 200px;" />
                            </colgroup>

                            <thead><tr>
                                <th scope="col">Название</th>
                                <th scope="col">Короткий адрес</th>
                                <th scope="col">Автор</th>
                            </tr></thead>

                            <tbody><tr>
                                <td>
                                    <template v-if="mode === 'edit' && !survey.isFixed">
                                        <input
                                            type="text"
                                            placeholder="Название опроса"
                                            v-exp-autosave:name="'main'"
                                            v-model="survey.name"
                                            class="admin-input" />
                                    </template>
                                    <template v-else>
                                        {{ survey.name }}
                                    </template>
                                </td>
                                <td>
                                    <pre v-if="[ 'published' ].includes(survey.status.id)"><a class="admin-link" :href="surveyDomain+`/survey/${survey.link}`">{{ survey.link }}</a></pre>
                                    <pre v-else-if="[ 'draft', 'completed' ].includes(survey.status.id)"><button type="button" class="admin-link" @click="alertOfCode">{{ survey.link }}</button></pre>
                                </td>
                                <td>
                                    <UserReference :user="survey.createdBy" representation="short" />
                                </td>
                            </tr></tbody>
                        </table>

                        <br />

                        <table class="admin-table">
                            <thead><tr>
                                <th scope="col" style="width: 200px">Изображение</th>
                                <th scope="col">Описание</th>
                            </tr></thead>

                            <tbody><tr>
                                <td>
                                    <MediaEditable
                                        v-model="survey.avatar"
                                        v-exp-autosave:avatar="'main'"
                                        :readonly="mode !== 'edit'"
                                        auto />
                                </td>

                                <td class="top-align">
                                    <template v-if="mode === 'edit' && !survey.isFixed">
                                        <textarea
                                            class="admin-input"
                                            placeholder="Описание опроса"
                                            v-exp-autosave:description="'main'"
                                            v-model="survey.description">
                                        </textarea>
                                    </template>
                                    <p
                                        v-else-if="survey.description"
                                        v-html="survey.description.replaceAll('\n', '<br />')">
                                    </p>
                                    <span v-else class="no-content-msg">Без описания</span>
                                </td>
                            </tr></tbody>
                        </table>

                        <br />

                        <table class="admin-table">
                            <colgroup>
                                <col />
                                <col />
                                <col />
                                <col />
                            </colgroup>

                            <thead><tr>
                                <th scope="col">Территория</th>
                                <th scope="col">Направление</th>
                                <th scope="col">Шаблон</th>
                                <th scope="col">Группы</th>
                            </tr></thead>

                            <tbody><tr>
                                <td>
                                    <template v-if="mode === 'edit' && !survey.isFixed">
                                        <Dropdown v-model="survey.territory" v-exp-autosave:territory="'main'" class="admin-input" arrow="v-20">
                                            <li v-if="user.globalAffiliation" v-value="null">На всех территориях</li>
                                            <li v-for="territory of territories" v-value="{ id: territory.id }">{{ territory.name }}</li>
                                        </Dropdown>
                                    </template>
                                    <template v-else>
                                        {{ survey.territory?.name ?? 'На всех территориях' }}
                                    </template>
                                </td>
                                <td>
                                    <template v-if="mode === 'edit' && !survey.isFixed">
                                        <Dropdown v-model="survey.direction" v-exp-autosave:direction="'main'" class="admin-input" arrow="v-20">
                                            <li v-value="null">Без направления</li>
                                            <li v-for="direction of directions" v-value="{ id: direction.id }">{{ direction.name }}</li>
                                        </Dropdown>
                                    </template>
                                    <template v-else>
                                        {{ survey.direction?.name ?? 'Без направления' }}
                                    </template>
                                </td>
                                <td>
                                    <template v-if="survey.template">
                                        <nuxt-link class="admin-link" :to="`/admin/survey/${survey.template.id}`">
                                            {{ survey.template.name }}
                                        </nuxt-link>
                                    </template>
                                    <p v-else class="no-content-msg">Не использовался</p>
                                </td>
                                <td>
                                    <Multiple
                                        v-if="mode === 'edit'"
                                        class="admin-input"
                                        placeholder="Без групп (видно для всех)"
                                        :options="groups"
                                        v-exp-autosave:groups="'main'"
                                        v-model="survey.groups"/>

                                    <p v-else-if="survey.groups.length">
                                        {{ survey.groups.map(g => g.name).join(', ') }}
                                    </p>
                                    <p v-else class="no-content-msg">без групп (видно для всех)</p>
                                </td>
                            </tr></tbody>
                        </table>

                        <br />

                        <table class="admin-table">
                            <colgroup>
                                <col />
                                <col />
                            </colgroup>

                            <thead><tr>
                                <th scope="col">Изменения статуса</th>
                                <th scope="col"></th>
                            </tr></thead>

                            <tbody><tr>
                                <td>
                                    <table id="date-table">
                                        <tr>
                                            <td>{{ formatDate(survey.createdAt, 'd ofmonth yyyy') }}</td>
                                            <td class="arrow">&gt;</td>
                                            <td>{{ survey.updatedAt ? formatDate(survey.updatedAt, 'd ofmonth yyyy') : 'не изменялся' }}</td>
                                            <td class="arrow">&gt;</td>
                                            <td>{{ survey.publishedAt ? formatDate(survey.publishedAt, 'd ofmonth yyyy') : 'не опубликован' }}</td>
                                            <td class="arrow">&gt;</td>
                                            <td>{{ survey.completedAt ? formatDate(survey.completedAt, 'd ofmonth yyyy') : 'не завершён' }}</td>
                                        </tr>
                                        <tr>
                                            <th scope="col" >Создано</th>
                                            <td></td>
                                            <th scope="col">Изменено</th>
                                            <td></td>
                                            <th scope="col">Опубликовано</th>
                                            <td></td>
                                            <th scope="col">Завершено</th>
                                        </tr>
                                    </table>
                                </td>
                                <td>
                                    <div class="survey-extra-actions layout-horizontal">
                                        <template v-if="survey.status.id === 'template'">
                                            <button
                                                type="button"
                                                class="admin-button layout-horizontal bg-special"
                                                @click="convertToDraft()">

                                                Создать опрос из шаблона
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m242-200 206.67-280L242-760h82l206.67 280L324-200h-82Zm247.33 0L696-480 489.33-760h82L778-480 571.33-200h-82Z"/></svg>
                                            </button>
                                        </template>
                                        <template v-else-if="survey.status.id === 'draft' && user.owns('survey:publish', survey.createdBy)">
                                            <button
                                                type="button"
                                                class="admin-button layout-horizontal bg-warning"
                                                @click="publish()">

                                                Опубликовать
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m242-200 206.67-280L242-760h82l206.67 280L324-200h-82Zm247.33 0L696-480 489.33-760h82L778-480 571.33-200h-82Z"/></svg>
                                            </button>
                                        </template>
                                        <template v-else-if="survey.status.id === 'published' && user.owns('survey:complete', survey.createdBy)">
                                            <button
                                                type="button"
                                                class="admin-button layout-horizontal bg-delete"
                                                @click="complete()">

                                                Завершить
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m242-200 206.67-280L242-760h82l206.67 280L324-200h-82Zm247.33 0L696-480 489.33-760h82L778-480 571.33-200h-82Z"/></svg>
                                            </button>
                                        </template>
                                        <template v-else></template>

                                        <button
                                            v-if="mode === 'edit' && survey.status.id === 'draft'"
                                            type="button"
                                            class="admin-button bg-special"
                                            @click="convertToTemplate()">

                                            Превратить&nbsp;в&nbsp;шаблон
                                        </button>
                                    </div>
                                </td>
                            </tr></tbody>
                        </table>

                        <div class="layout-horizontal wrap margin-top margin-bottom">
                            <nuxt-link
                                v-if="[ 'published', 'completed' ].includes(survey.status.id) && user.can.viewAnalytics.survey"
                                class="admin-button bg-special"
                                :to="`/analytics/survey/${this.survey.id}`"
                                no-prefetch>

                                Открыть инфографику
                            </nuxt-link>

                            <a
                                v-if="[ 'published' ].includes(survey.status.id)"
                                class="admin-button bg-info"
                                :href="`${surveyDomain}/survey/${this.survey.link}#back`">

                                Открыть страницу прохождения опроса
                            </a>

                            <nuxt-link
                                v-if="[ 'published' ].includes(survey.status.id)"
                                class="admin-button bg-info"
                                :to="`/admin/survey/${this.survey.id}/${this.survey.link}`">

                                Заполнить формы от лица администратора
                            </nuxt-link>

                            <Dropdown id="survey-export" class="admin-button bg-option" title="Экспортировать ..." navigation>
                                <li @click="toPDF()">опросную форму в <b>PDF</b></li>
                                <template v-if="[ 'published', 'completed' ].includes(survey.status.id)">
                                    <li @click="toPDFRes()">аналитические дашборды в <b>PDF</b></li>
                                    <li @click="toXLSX(true)">результаты в <b>XLSX</b> (только с признаком "сбор данных")</li>
                                    <li @click="toXLSX(false)">результаты в <b>XLSX</b> (включая вопросы без сбора данных)</li>
                                    <li @click="toCSV(true)">результаты в <b>CSV</b> (только с признаком "сбор данных")</li>
                                    <li @click="toCSV(false)">результаты в <b>CSV</b> (включая вопросы без сбора данных)</li>
                                </template>
                            </Dropdown>

                            <br />
                            <br />

                            <button
                                v-if="user.owns('survey:delete', survey.createdBy) && !survey.isFixed"
                                type="button"
                                class="admin-button bg-delete"
                                @click="remove">

                                Удалить опрос
                            </button>
                        </div>
                    </div>

                    <h2 class="admin-panel-title">Управление структурой опроса</h2>

                    <TableOfContents
                        :groups="survey.chapters"
                        items="questions"
                        add-group-hint="Добавить раздел"
                        add-item-hint="добавить вопрос"
                        :readonly="mode !== 'edit' || survey.isFixed"
                        :freeze="survey.chapters.filter(c => c.isFixed).map(c => c.id)"
                        @clickgroup="goTo('chapter-' + $event.group.id)"
                        @clickitem="goTo('question-' + $event.group.id + '-' + $event.index)"
                        @addgroup="addChapter()"
                        @additem="addQuestionTo($event.group, types[0].id)"
                        @movegroup="moveGroup($event.from, $event.to)"
                        @moveitem="moveItem($event.group, $event.from, $event.to)"
                        @deletegroup="deleteChapter($event.group)"
                        @deleteitem="deleteQuestionOf($event.group, $event.item)"
                    />
                </section>

                <section v-for="(chapter, i) in survey.chapters" :key="chapter.id" class="admin-panel size-full">
                    <span class="admin-panel-title hidden">Раздел №{{ i + 1 }}. {{ chapter.name }}</span>

                    <h2 :id="'chapter-'+chapter.id" class="admin-panel-title layout-horizontal a-center chapter">
                        <span>Раздел №{{ i + 1 }}</span>

                        <input
                            v-if="mode === 'edit' && !chapter.isFixed"
                            class="admin-input name"
                            :class="{ 'admin-input-error': !chapter.name }"
                            type="text"
                            placeholder="Название раздела"
                            v-exp-autosave:name="[ 'chapter', chapter.id ]"
                            v-model="chapter.name" />

                        <span v-else class="name">{{ chapter.name }}</span>

                        <button
                            v-if="mode === 'edit' && !chapter.isFixed"
                            type="button"
                            class="admin-button delete"
                            @click="deleteChapter(chapter)">

                            удалить раздел
                        </button>
                    </h2>

                    <p v-if="mode === 'edit' && chapter.isFixed" class="warning-msg margin-bottom">
                        Этот раздел не может быть отредактирован ввиду поставленных на него ограничений.
                    </p>

                    <div class="chapter-sections layout-horizontal a-start">
                        <div class="chapter-section expandable description">
                            <textarea
                                v-if="mode === 'edit' && !chapter.isFixed"
                                class="admin-input"
                                placeholder="Описание раздела"
                                v-auto-size
                                v-exp-autosave:description="[ 'chapter', chapter.id ]"
                                v-model="chapter.description">
                            </textarea>
                            <p
                                v-else-if="chapter.description"
                                v-html="chapter.description.replaceAll('\n', '<br />')">
                            </p>
                            <span v-else class="no-content-msg">Без описания</span>
                        </div>

                        <div v-if="mode === 'edit' && !chapter.isFixed" class="chapter-section expandable layout-vertical a-start questions">
                            <Question
                                v-for="(q, qi) in chapter.questions"
                                :key="q.id"
                                :id="'question-' + chapter.id + '-' + qi"
                                :q="q"
                                :chapter="chapter.id"
                                @delete="deleteQuestionOf(chapter, q)"
                                @template="openTemplates" />

                            <Dropdown class="admin-button questions bg-positive" title="Добавить вопрос" navigation arrow="v-20">
                                <li v-for="type in types" :key="type.id" @click="addQuestionTo(chapter, type.id)">
                                    <svg v-if="type.icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="20" height="20">
                                        <path :d="type.icon"/>
                                    </svg>
                                    {{ type.name }}
                                </li>
                            </Dropdown>
                        </div>

                        <div v-else class="chapter-section expandable layout-vertical a-start questions">
                            <ViewQuestion
                                v-for="(q, qi) in chapter.questions"
                                :key="q.id"
                                :id="'question-' + chapter.id + '-' + qi"
                                :q="q"
                                :qindex="qi"
                                :chapter="chapter.id" />
                        </div>
                    </div>
                </section>

                <section v-if="mode === 'edit' && !survey.isFixed" class="admin-panel size-full">
                    <button type="button" class="admin-button standalone-button bg-positive" @click="addChapter">
                        Добавить раздел
                    </button>
                </section>
            </main>
        </div>

        <ModalForm ref="templateModal" :maxWidth="'1000px'" header="Выберите шаблон для вставки">
            <div v-for="(group, group_name) in templates" :key="group_name" class="template-selector-group">
                <h2 class="template-selector-group-title">{{ group_name }}</h2>

                <ul class="template-selector">
                    <li v-for="(template, t_index) in group" :key="t_index" class="template-selector-element-container">
                        <button type="button" @click="closeTemplatesWith(template)" class="template-selector-element">
                            <h2 class="template-selector-element-title">{{ template.name }}</h2>

                            <ul class="template-selector-element-answers">
                                <li v-for="(answer, a_index) in template.answers" :key="answer">
                                    <div class="choice-field-point" :style="'background: ' + colours[a_index % colours.length]"></div>
                                    <p>{{ answer }}</p>
                                </li>
                            </ul>
                        </button>
                    </li>
                </ul>
            </div>
        </ModalForm>
    </div>
</template>


<script>
import { Permissions } from "~/plugins/scripts/classes"
import { formatted_title, formatDate, generateColours } from "~/plugins/scripts/utils"
import { Surveys } from "~/plugins/api/surveys";
import { Files } from "~/plugins/api/utils";


export default {
    name: "adminSurvey",

    middleware: [
        Permissions.expectedToHave('survey:view'),
        'survey/@id',
        Permissions.expectedAffiliation(ctx => ctx.store.state.survey.territory?.id, true),
        'survey/#question-types',
        'survey/#answer-presets'
    ],

    layout: 'admin',

    components: {
        Question: () => import("~/components/surveys/edit/Question"),
        ViewQuestion: () => import("~/components/surveys/fill/Question"),

        AdminHeader: () => import("~/components/admin/AdminHeader"),
        AdminNavigation: () => import("~/components/admin/AdminNavigation"),
        TableOfContents: () => import("~/components/controls/TableOfContents"),
        UserReference: () => import("~/components/utils/UserReference"),
        Multiple: () => import("~/components/controls/Multiple"),
        Dropdown: () => import("~/components/controls/Dropdown"),
        ModalForm: () => import("~/components/controls/ModalForm"),
        MediaEditable: () => import("~/components/media/MediaEditable"),
    },

    data () {
        let survey = this.$store.state.survey
        let chapterPriority = 1
        for (let chapter of survey.chapters) {
            if (chapter.priority >= chapterPriority) {
                chapterPriority = chapter.priority + 1
            }
        }

        return {
            user: this.$store.state.user,
            survey,
            mode: this.$route.query.mode || 'view',
            chapterPriority,

            types: this.$store.state.questionTypes,
            templates: this.$store.state.answerPresets,

            territories: this.$store.state.ini.territories,
            directions: this.$store.state.ini.directions,
            groups: this.$store.state.ini.groups,

            colours: generateColours(),
            templateCallback: null,

            surveyDomain: this.$nuxt.context.env.SURVEY_BASE_URL
        }
    },

    head () {
        return { title: formatted_title(this.survey?.name, 'Опросы') }
    },

    beforeMount () {
        this.$expsaving.bind('main', (...p) => this.save(...p))
        this.$expsaving.bind('chapter', (...p) => this.saveChapter(...p))
        this.$expsaving.bind('reorder', (...p) => this.saveReordering(...p))
    },

    methods: {
        formatDate,

        //----------------------------------- handlers

        goTo (id) {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
        },

        openAnalytics () {
            this.$router.push({ path: `/analytics/survey/${this.survey.id}` })
        },

        async addChapter () {
            const name = await this.$layer.prompt('Укажите название нового раздела', {
                style: 'success',
                confirm: 'Добавить',
                required: true
            })

            if (!name) return

            Surveys.chapters.create({
                survey: { id: this.survey.id },
                name,
                priority: this.chapterPriority ++
            })
                .then(chapter => {
                    chapter.questions = []
                    this.survey.chapters.push(chapter)
                })
        },

        async addQuestionTo (chapter, type) {
            // const name = await this.$layer.prompt('Укажите название вопроса', { style: 'success', required: true })
            //
            // if (!name) return
            //
            // await Surveys.questions.create({
            //     chapter: { id: chapter.id },
            //     type: { id: type },
            //     answers: [ { name: '' }, { name: '' } ],
            //     points: [ { name: '' }, { name: '' } ],
            //     name,
            // })
            // .then(question => { chapter.questions.push(question) })

            const name = 'Вопрос #' + (chapter.questions.length + 1)
            chapter.questions.push({
                chapter: { id: chapter.id },
                type: { id: type },
                name,
                description: '',
                priority: chapter.questions.length,
                isOptional: false,
                isChartable: false,
                coloring: 'default',
                answers: [],
                points: [],
                minScale: 1,
                maxScale: 5,
                scaleHints: [ '', '', '', '', '' ]
            })
        },

        async moveGroup (from, to) {
            this.survey.chapters.splice(to, 0, this.survey.chapters.splice(from, 1)[0])
            this.survey.chapters.forEach((q, i) => q.priority = i)
            this.$expsaving.set('reorder', -1)
        },

        async moveItem (chapter, from, to) {
            chapter.questions.splice(to, 0, chapter.questions.splice(from, 1)[0])
            chapter.questions.forEach((q, i) => q.priority = i)
            this.$expsaving.set('reorder', chapter.id)
        },

        async deleteChapter (chapter) {
            const agree = await this.$layer.confirm(
                'Вы уверены, что хотите удалить этот раздел?', { style: 'danger' }
            )

            if (!agree) return

            await Surveys.chapters.delete(chapter.id)
            this.survey.chapters.splice(this.survey.chapters.findIndex(c => c.id === chapter.id), 1)
        },

        async deleteQuestionOf (chapter, question) {
            if (question.id) await Surveys.questions.delete(question.id)
            chapter.questions.splice(chapter.questions.indexOf(question), 1)
            chapter.questions.forEach((q, i) => q.priority = i)
            await Surveys.questions.reorder(chapter.questions.map(q => q.id))
        },

        alertOfCode () {
            if (this.survey.status.id === 'draft') {
                this.$layer.alert((
                    'Это уникальный код опроса, который будет использоваться после публикации опроса. \n' +
                    'Ссылка на опрос после публикации: \n\n' +
                    `${window.location.origin}/survey/${this.survey.link}`
                ), { style: 'info' })
            }
            else if (this.survey.status.id === 'completed') {
                this.$layer.alert((
                    'Этот уникальный код опроса более не действителен так как опрос является завершенным.'
                ), { style: 'warning' })
            }
        },

        //----------------------------------- save

        /**
         * @param _
         * @param {Set<string>} fields
         */
        async save (_, fields) {
            let body = {}

            for (let field of fields) {
                body[field] = this.survey[field]
            }

            console.log(this.survey)

            await Surveys.update(this.survey.id, body, false)
        },

        /**
         * @param {number} chapterId
         * @param {Set<string>} fields
         */
        async saveChapter (chapterId, fields) {
            let chapter = this.survey.chapters.find(c => c.id == chapterId)
            if (!chapter) return

            let body = {}

            for (let field of fields) {
                body[field] = chapter[field]
            }

            await Surveys.chapters.update(chapter.id, body, false)
        },

        /**
         * @param {-1 | number} chapterId
         * @param _
         */
        async saveReordering (chapterId, _) {
            if (chapterId == -1) {
                await Surveys.chapters.reorder(this.survey.chapters.map(q => q.id))
            }
            else {
                let chapter = this.survey.chapters.find(c => c.id == chapterId)
                await Surveys.questions.reorder(chapter.questions.map(q => q.id))
            }
        },

        //----------------------------------- other

        async convertToTemplate () {
            const result = await this.$layer.ask({
                action: {
                    type: 'radio',
                    name: 'Как вы хотите создать шаблон?',
                    required: true,
                    nullable: false,
                    options: {
                        copy: 'Создать копию черновика и сохранить как шаблон',
                        convert: 'Превратить черновик в шаблон',
                    },
                    expect: 'key'
                }
            }, { size: 'normal', end: 'Применить' })

            if (!result) return

            switch (result.action) {
                case 'copy':
                    const copy = await Surveys.copyAsTemplate(this.survey.id)
                    await this.$router.push(`/admin/survey/${copy.id}?mode=edit`)
                    break

                case 'convert':
                    await Surveys.convertToTemplate(this.survey.id)
                    this.$router.go(0)
                    break
            }
        },

        async convertToDraft () {
            const agree = await this.$layer.confirm(
                'Вы хотите использовать этот шаблон для создания нового опроса?', { style: 'success' }
            )

            if (!agree) return

            const draft = await Surveys.copyAsDraft(this.survey.id)
            this.$router.push(`/admin/survey/${draft.id}?mode=edit`)
        },

        async remove () {
            const agree = await this.$layer.confirm('Вы уверены, что хотите удалить этот опрос?\n Это действие нельзя отменить.', {
                style: 'danger',
                confirm: 'Удалить'
            })

            if (!agree) return

            await Surveys.delete(this.survey.id)

            await this.$router.push('/admin/survey')
        },

        //----------------------------------- question templates

        openTemplates (callback) {
            this.templateCallback = callback
            this.$refs.templateModal.raise()
        },

        closeTemplatesWith (result) {
            this.$refs.templateModal.close()
            if (result) this.templateCallback?.(result)
        },

        //----------------------------------- status management

        async publish () {
            let total = 0
            let chartable = 0
            for (let chapter of this.survey.chapters) {
                total += chapter.questions.length
                chartable += chapter.questions.filter(q => q.isChartable).length
            }

            let agree
            if (chartable == total) {
                agree = await this.$layer.confirm(
                    'На всех ваших вопросах отмечен флаг "Сбор данных"! ' +
                    'Вы не сможете посмотреть инфографику опроса, поскольку нечего будет отображать. ' +
                    'Однако вы всё ещё сможете скачать данные в формате XLSX/CSV.\n\n ' +
                    'Вы уверены, что хотите опубликовать этот опрос?\n ' +
                    'После подтверждения вы уже не сможете его поменять.\n\n ' +
                    'Опрос останется публично доступным для заполнения до тех пор, пока не будет переведёт в статус "Завершен".',
                    { style: 'danger' }
                )
            }
            else {
                agree = await this.$layer.confirm(
                    'Вы уверены, что хотите опубликовать этот опрос?\n ' +
                    'После подтверждения вы уже не сможете его поменять.\n\n ' +
                    'Опрос останется публично доступным для заполнения до тех пор, пока не будет переведёт в статус "Завершен".',
                )
            }
            if (!agree) return

            await Surveys.publish(this.survey.id)
            this.survey.publishedAt = (new Date).toISOString()
            this.survey.status = { id: 'published', name: 'Опубликован' }
        },

        async complete (survey) {
            const agree = await this.$layer.confirm(
                'Вы уверены, что хотите завершить этот опрос?\n ' +
                'После подтверждения опрос будет скрыт из общего доступа и более не доступен к заполнению.\n\n ' +
                'Если вам нужны текущие результаты прохождения, вы можете экспортировать их без завершения опроса.',
            )
            if (!agree) return

            await Surveys.complete(this.survey.id)
            this.survey.completedAt = (new Date).toISOString()
            this.survey.status = { id: 'completed', name: 'Завершён' }
        },

        //----------------------------------- export

        toPDF () { Surveys.export.toPDF(this.survey) },
        toPDFRes () { Surveys.export.toPDFRes(this.survey) },
        toXLSX (filter = false) { Surveys.export.toXLSX(this.survey, filter) },
        toCSV (filter = false) { Surveys.export.toCSV(this.survey, filter) },
    }
}
</script>


<style scoped>
#date-table :is(td, th) {
    padding: 0 4px;
    text-align: left;
}
#date-table td {
    font-weight: bold;
    color: var(--colour-link);
}
#date-table th {
    font-size: 90%;
    font-weight: normal;
    color: #666;
}
#date-table .arrow {
    padding: 0 10px;
}


#survey-export {
    text-align: left;
}


.top-align {
    vertical-align: top;
}


.survey-extra-actions .admin-button > svg {
    width: 22px;
    min-width: 22px;
    max-width: 22px;
    height: 22px;
    min-height: 22px;
    max-height: 22px;
}


.admin-panel-title.chapter .name {
    flex: 1;
    width: 50%;
    font-weight: normal;
}

.chapter-sections {
    flex-flow: row-reverse wrap;
    gap: 30px;
}

.chapter-section.questions {
    min-width: 700px;
}
.chapter-section.description {
    min-width: 300px;
    max-width: 800px;
}

@media (max-width: 800px) {
    .chapter-sections {
        flex-flow: column nowrap;
    }

    .chapter-section {
        width: 100% !important;
        min-width: auto !important;
        max-width: none !important;
    }
}

.admin-button.questions { text-align: left; }
.admin-button.questions :deep(li) {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
}


.template-selector-group {
    width: 100%;
    margin-top: 10px;
}

.template-selector-group-title {
    box-sizing: border-box;
    width: 100%;
    padding: 8px 8px 2px 20px;
    margin-bottom: 8px;
    border-bottom: 2px solid #000;
    border-radius: 10px 10px 0 0;
    background: #d8e0e4;
    font-size: 24px;
    font-weight: bold;
    cursor: default;
}

.template-selector {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: stretch;
    gap: 20px;
    width: 100%;
    list-style: none;
}

.template-selector-element-container {
    display: flex;
    flex-grow: 1;
    min-width: 300px;
    padding: 10px;
    border-radius: 10px;
    background: #FFF;
    box-shadow: 0 1px 4px 0 #888;
    transition: .25s;
}
.template-selector-element-container:hover {
    transform: translateY(-6px);
    box-shadow: 0 1px 16px 0 #888;
}

.template-selector-element {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
}

.template-selector-element-answers {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 6px;
    width: 100%;
    list-style: none;
}

.template-selector-element-title {
    font-weight: bold;
}

.template-selector-element-answers .choice-field-point {
    width: 8px;
    height: 8px;
}

.template-selector-element-answers > li {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
}
</style>
