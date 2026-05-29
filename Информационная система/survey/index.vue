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
                    path: '#',
                },
            ]"
            :site_link="'/all?of=surveys'"/>


        <div id="admin-main">
            <AdminNavigation :actions="[]"/>

            <main class="admin-body">
                <div class="admin-vertical size-full">
                    <section id="surveys-nav" class="admin-panel size-full">
                        <h2 class="admin-panel-title hidden">Вкладки</h2>

                        <div id="tablist" class="layout-horizontal" role="tablist">
                            <button
                                type="button"
                                title="создать"
                                class="tablist-item create admin-button layout-horizontal bg-positive"
                                @click="createDraft">

                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M448.67-280h66.66v-164H680v-66.67H515.33V-680h-66.66v169.33H280V-444h168.67v164Zm31.51 200q-82.83 0-155.67-31.5-72.84-31.5-127.18-85.83Q143-251.67 111.5-324.56T80-480.33q0-82.88 31.5-155.78Q143-709 197.33-763q54.34-54 127.23-85.5T480.33-880q82.88 0 155.78 31.5Q709-817 763-763t85.5 127Q880-563 880-480.18q0 82.83-31.5 155.67Q817-251.67 763-197.46q-54 54.21-127 85.84Q563-80 480.18-80Z"/></svg>
                            </button>

                            <button
                                type="button"
                                class="tablist-item admin-button layout-horizontal bg-info"
                                :class="{ active: tab === 'draft' }"
                                @mouseenter.once="requestSurveys('draft')"
                                @click="tab = 'draft'"
                                role="tab">

                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M226.67-80q-27 0-46.84-19.83Q160-119.67 160-146.67v-666.66q0-27 19.83-46.84Q199.67-880 226.67-880H560l240 240v134.67q-19 3.66-36.33 13Q746.33-483 732-468.67L493.33-231v151H226.67ZM560-80v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8.67 9 12.83 20 4.17 11 4.17 22t-4.33 22.5q-4.34 11.5-13.34 20.5L683-80H560Zm263-224 37-39-37-37-38 38 38 38ZM520-600h213.33L520-813.33 733.33-600 520-813.33V-600Z"/></svg>
                                Черновики
                            </button>

                            <span class="tablist-arrow"></span>

                            <button
                                type="button"
                                class="tablist-item admin-button layout-horizontal bg-warning"
                                :class="{ active: tab === 'published' }"
                                @mouseenter.once="requestSurveys('published')"
                                @click="tab = 'published'"
                                role="tab">

                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M319.33-246.67h321.34v-66.66H319.33v66.66Zm0-166.66h321.34V-480H319.33v66.67ZM226.67-80q-27 0-46.84-19.83Q160-119.67 160-146.67v-666.66q0-27 19.83-46.84Q199.67-880 226.67-880H574l226 226v507.33q0 27-19.83 46.84Q760.33-80 733.33-80H226.67Zm314-542.67h192.66L540.67-813.33v190.66Z"/></svg>
                                Опубликованные
                            </button>

                            <span class="tablist-arrow"></span>

                            <button
                                type="button"
                                class="tablist-item admin-button layout-horizontal bg-negative"
                                :class="{ active: tab === 'completed' }"
                                @mouseenter.once="requestSurveys('completed')"
                                @click="tab = 'completed'"
                                role="tab">

                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m435.33-250 228-228L618-523.33l-183 183L338.33-437l-45 45 142 142ZM226.67-80q-27 0-46.84-19.83Q160-119.67 160-146.67v-666.66q0-27 19.83-46.84Q199.67-880 226.67-880H574l226 226v507.33q0 27-19.83 46.84Q760.33-80 733.33-80H226.67Zm314-542.67h192.66L540.67-813.33v190.66Z"/></svg>
                                Завершённые
                            </button>

                            <span class="tablist-line"></span>

                            <button
                                type="button"
                                class="tablist-item admin-button layout-horizontal"
                                :class="{ active: tab === 'template' }"
                                @mouseenter.once="requestSurveys('template')"
                                @click="tab = 'template'"
                                role="tab">

                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M226.67-80q-27 0-46.84-19.83Q160-119.67 160-146.67v-666.66q0-27 19.83-46.84Q199.67-880 226.67-880H574l226 226v507.33q0 27-19.83 46.84Q760.33-80 733.33-80H226.67Zm314-542.67h192.66L540.67-813.33v190.66Z"/></svg>
                                Шаблоны
                            </button>

                            <button
                                type="button"
                                class="tablist-item search admin-button layout-horizontal bg-option"
                                @click="openSearch">

                                Поиск
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M792-120.67 532.67-380q-30 25.33-69.64 39.67Q423.39-326 378.67-326q-108.44 0-183.56-75.17Q120-476.33 120-583.33t75.17-182.17q75.16-75.17 182.5-75.17 107.33 0 182.16 75.17 74.84 75.17 74.84 182.27 0 43.23-14 82.9-14 39.66-40.67 73l260 258.66-48 48Zm-414-272q79.17 0 134.58-55.83Q568-504.33 568-583.33q0-79-55.42-134.84Q457.17-774 378-774q-79.72 0-135.53 55.83-55.8 55.84-55.8 134.84t55.8 134.83q55.81 55.83 135.53 55.83Z"/></svg>
                            </button>
                        </div>

                        <div class="sorting">
                            Сортировка: <select v-model="ordered" class="admin-select"><option value="desc">сначала недавние</option><option value="asc">сначала поздние</option></select>
                        </div>
                    </section>

                    <section class="admin-panel size-full">
                        <h2 class="admin-panel-title hidden">Опросы</h2>

                        <div class="admin-table-container">
                            <table id="surveys" class="admin-table" role="tabpanel">
                                <thead><tr>
                                    <th scope="col">№</th>
                                    <th scope="col">Название</th>
                                    <th scope="col">Автор</th>
                                    <th scope="col">Территория</th>
                                    <th scope="col">{{
                                        tab === 'draft'     ? 'Создано' :
                                        tab === 'published' ? 'Опубликовано' :
                                        tab === 'completed' ? 'Проводилось' :
                                        tab === 'template'  ? 'Создано' : ''
                                    }}</th>
                                    <th scope="col">Ответов</th>
                                    <th scope="col">Действия</th>
                                    <th scope="col"></th>
                                </tr></thead>

                                <tbody>
                                    <tr
                                        v-for="(survey, i) in cache[tab].list"
                                        class="survey-row"
                                        :style="{ background: survey.isFixed ? '#fcf4e7' : null }"
                                        :key="tab + survey.id">

                                        <td>{{ i + 1 }}</td>
                                        <th scope="row">
                                            <nuxt-link v-if="survey.canUpdate" class="admin-link" :to="`/admin/survey/${survey.id}`">
                                                {{ survey.name ?? '<без названия>' }}
                                            </nuxt-link>
                                            <template v-else>
                                                {{ survey.name }}
                                            </template>
                                        </th>
                                        <td>
                                            <UserReference :user="survey.createdBy" :representation="'short'" />
                                        </td>
                                        <td>
                                            <span v-if="survey.territory">{{ survey.territory.name }}</span>
                                            <span v-else class="no-content-msg">На всех территориях</span>
                                            <br />
                                            <template v-if="survey.direction">{{ survey.direction.name }}</template>
                                            <span class="no-content-msg" v-else>Без направления</span>
                                        </td>

                                        <!-- DRAFT -- start -->

                                        <template v-if="tab === 'draft'">
                                            <td>
                                                {{ formatDate(survey.createdAt, 'd ofmonth yyyy') }}
                                                <br v-if="survey.updatedAt" />
                                                <span v-if="survey.updatedAt" class="no-content-msg">
                                                    (ред. {{ formatDate(survey.updatedAt, 'd ofmonth yyyy') }})
                                                </span>
                                            </td>
                                            <td>-</td>
                                            <td>
                                                <Dropdown
                                                    class="survey-export admin-button bg-option"
                                                    :disabled="!(user.can.export.survey && (user.isGlobalRole || survey.createdBy.id === user.id))"
                                                    title="Экспортировать ..." navigation>
                                                    <li @click="toPDF(survey)">опросную форму в <b>PDF</b></li>
                                                </Dropdown>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    class="admin-button layout-horizontal bg-warning"
                                                    :disabled="!survey.canPublish"
                                                    @click="publish(survey)">

                                                    Опубликовать
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                                        <path
                                                            d="m242-200 206.67-280L242-760h82l206.67 280L324-200h-82Zm247.33 0L696-480 489.33-760h82L778-480 571.33-200h-82Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </template>

                                        <!-- DRAFT >>> PUBLISHED -->

                                        <template v-else-if="tab === 'published'">
                                            <td>
                                                {{ formatDate(survey.publishedAt, 'd ofmonth yyyy') }}
                                            </td>
                                            <td>{{ survey.respondentsCount }}</td>
                                            <td>
                                                <Dropdown
                                                    class="survey-export admin-button bg-option"
                                                    :disabled="!(user.can.export.survey && (user.isGlobalRole || survey.createdBy.id === user.id))"
                                                    title="Экспортировать ..." navigation>
                                                    <li @click="toPDF(survey)">опросную форму в <b>PDF</b></li>
                                                    <li @click="toPDFRes(survey)">аналитические дашборды в <b>PDF</b></li>
                                                    <li @click="toXLSX(survey, true)">результаты в <b>XLSX</b> (только с признаком "сбор данных")</li>
                                                    <li @click="toXLSX(survey, false)">результаты в <b>XLSX</b> (включая вопросы без сбора данных)</li>
                                                    <li @click="toCSV(survey, true)">результаты в <b>CSV</b> (только с признаком "сбор данных")</li>
                                                    <li @click="toCSV(survey, false)">результаты в <b>CSV</b> (включая вопросы без сбора данных)</li>
                                                </Dropdown>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    class="admin-button layout-horizontal bg-delete"
                                                    :disabled="!survey.canComplete"
                                                    @click="complete(survey)">

                                                    Завершить
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                                        <path
                                                            d="m242-200 206.67-280L242-760h82l206.67 280L324-200h-82Zm247.33 0L696-480 489.33-760h82L778-480 571.33-200h-82Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </template>

                                        <!-- PUBLISHED >>> COMPLETED -->

                                        <template v-else-if="tab === 'completed'">
                                            <td>
                                                с {{ formatDate(survey.publishedAt, 'd ofmonth yyyy') }}
                                                <br />
                                                по {{ formatDate(survey.completedAt, 'd ofmonth yyyy') }}
                                                <br />
                                                ({{ differenceBetween(survey.publishedAt, survey.completedAt) }})
                                            </td>
                                            <td>{{ survey.respondentsCount }}</td>
                                            <td>
                                                <Dropdown
                                                    class="survey-export admin-button bg-option"
                                                    :disabled="!(user.can.export.survey && (user.isGlobalRole || survey.createdBy.id === user.id))"
                                                    title="Экспортировать ..." navigation>
                                                    <li @click="toPDF(survey)">опросную форму в <b>PDF</b></li>
                                                    <li @click="toPDFRes(survey)">аналитические дашборды в <b>PDF</b></li>
                                                    <li @click="toXLSX(survey, true)">результаты в <b>XLSX</b> (только сбор данных)</li>
                                                    <li @click="toXLSX(survey, false)">результаты в <b>XLSX</b> (включая вопросы без сбора данных)</li>
                                                    <li @click="toCSV(survey, true)">результаты в <b>CSV</b> (только сбор данных)</li>
                                                    <li @click="toCSV(survey, false)">результаты в <b>CSV</b> (включая вопросы без сбора данных)</li>
                                                </Dropdown>
                                            </td>
                                            <td></td>
                                        </template>

                                        <!-- COMPLETED >>> TEMPLATE -->

                                        <template v-else-if="tab === 'template'">
                                            <td>
                                                {{ formatDate(survey.createdAt, 'd ofmonth yyyy') }}
                                            </td>
                                            <td>-</td>
                                            <td>
                                                <Dropdown
                                                    class="survey-export admin-button bg-option"
                                                    :disabled="!(user.can.export.survey && (user.isGlobalRole || survey.createdBy.id === user.id))"
                                                    title="Экспортировать ..." navigation>
                                                    <li @click="toPDF(survey)">опросную форму в <b>PDF</b></li>
                                                </Dropdown>
                                            </td>
                                            <td></td>
                                        </template>

                                        <!-- TEMPLATE -- end -->
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div ref="load"></div>
                    </section>
                </div>
            </main>
        </div>

        <ModalForm ref="search" header="Поиск опросов" max-width="1000px">
            <search id="survey-search-header">
                <Filters :filters="{
                    statuses: {
                        type: 'multiple',
                        label: 'Статус',
                        placeholder: 'любой',
                        options: [
                            { id: 'draft'    , name: 'черновик' },
                            { id: 'published', name: 'опубликован' },
                            { id: 'completed', name: 'завершен' },
                            { id: 'template' , name: 'шаблон' },
                        ],
                        initial: []
                    },
                    dateType: {
                        type: 'select',
                        label: 'Поиск по дате',
                        placeholder: '-',
                        options: {
                            createdAt: 'создания',
                            publishedAt: 'публикации',
                            completedAt: 'завершения'
                        },
                        initial: 'createdAt'
                    },
                    from: {
                        type: 'date',
                        label: 'От',
                    },
                    to: {
                        type: 'date',
                        label: 'До'
                    },
                    territories: {
                        type: 'multiple',
                        label: 'Территория',
                        placeholder: 'все',
                        options: [ { name: 'На всех территориях', id: 0 }, ...territories ],
                        initial:  []
                    },
                    directions: {
                        type: 'multiple',
                        label: 'Направление',
                        placeholder: 'все',
                        options: [ { name: 'Без направления', id: 0 }, ...directions ],
                        initial:  []
                    },
                    onlyOwned: {
                        type: 'checkbox',
                        label: 'Принадлежность',
                        checkboxMessage: 'только мои'
                    }
                }"
                @input="filters = $event" />

                <input type="search" placeholder="Поиск по названию" class="admin-input" v-model="search" />
            </search>

            <div id="survey-search-results" class="layout-vertical scrollbar s-round s-gray">
                <div v-if="searchResultMeta.count" id="survey-search-count">
                    Найдено результатов: <em>{{ searchResultMeta.count }}</em>
                </div>

                <nuxt-link v-for="result in searchResults" :key="result.id" :to="result.url" class="search-result">
                    <span class="name" v-html="result.marked"></span>
                    <span class="status" :class="result.status.id">{{ result.status.name }}</span>
                    <span class="space"></span>
                    <span class="territory">{{ result.territory?.name ?? 'На всех территориях' }}</span>
                </nuxt-link>

                <button
                    v-if="searchResults.length && searchResultMeta.hasNextPage"
                    type="button"
                    class="admin-button standalone bg-option"
                    @click="trySearch(searchResultMeta.nextPage)">

                    Показать ещё
                </button>
            </div>
        </ModalForm>
    </div>
</template>

<script>
import { debounce } from "lodash"
import { formatDate, formatted_title, plural } from "~/plugins/scripts/utils"
import { Surveys } from "~/plugins/api/surveys"
import { Files } from "~/plugins/api/utils"
import { Permissions } from "~/plugins/scripts/classes"


const ordering = {
    draft: 'createdAt',
    published: 'publishedAt',
    completed: 'completedAt',
    template: 'createdAt',
}


export default {
    name: "AdminSurveys",

    middleware: [
        Permissions.expectedToHave('survey:view')
    ],

    layout: "admin",

    components: {
        AdminHeader: () => import("~/components/admin/AdminHeader"),
        AdminNavigation: () => import("~/components/admin/AdminNavigation"),
        UserReference: () => import("~/components/utils/UserReference"),
        Dropdown: () => import("~/components/controls/Dropdown"),
        Filters: () => import("~/components/controls/Filters"),
        ModalForm: () => import("~/components/controls/ModalForm"),
    },

    data () {
        return {
            user: this.$store.state.user,
            tab: this.$route.query.tab || "published",
            ordered: this.$route.query.ordered || "desc",

            cache: {
                draft     : { page: 1, list: [], count: 0, hasNextPage: true, loading: false },
                published : { page: 1, list: [], count: 0, hasNextPage: true, loading: false },
                completed : { page: 1, list: [], count: 0, hasNextPage: true, loading: false },
                template  : { page: 1, list: [], count: 0, hasNextPage: true, loading: false }
            },
            loading: false,

            search: '',
            filters: {},
            searchResults: [],
            searchResultMeta: {
                count: 0,
                hasNextPage: true,
                nextPage: 1
            },

            territories: this.$store.state.ini.territories,
            directions: this.$store.state.ini.directions,

            trySearch: debounce((page = 1) => this._trySearch(page), 500, { leading: true, trailing: true }),
        };
    },

    head () {
        return { title: formatted_title('Опросы') }
    },

    watch: {
        tab () {
            this.$router.push({ query: { tab: this.tab } });
            if (!this.cache[this.tab].list.length) this.requestSurveys()
        },
        ordered () {
            this.$router.push({ query: { ordered: this.ordered } })
            this.cache = {
                draft     : { page: 1, list: [], count: 0, hasNextPage: true, loading: false },
                published : { page: 1, list: [], count: 0, hasNextPage: true, loading: false },
                completed : { page: 1, list: [], count: 0, hasNextPage: true, loading: false },
                template  : { page: 1, list: [], count: 0, hasNextPage: true, loading: false }
            }
            this.requestSurveys()
        },

        search () { this.trySearch() },
        filters () { this.trySearch() },
    },

    mounted () {
        let observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { this.requestSurveys() }
        })

        observer.observe(this.$refs.load)
        this.requestSurveys()
    },

    methods: {
        formatDate,
        plural,

        //----------------------------------- main

        async requestSurveys (status = null) {
            let statusId = status ?? this.tab
            let ordered = this.ordered

            if (!this.cache[statusId]?.hasNextPage || this.cache[statusId]?.loading) return

            this.cache[statusId].loading = true

            const data = await Surveys.paginated(this.cache[statusId].page, {
                filter: { statusesIds: statusId },
                order: { [ordering[statusId]]: ordered }
            })

            this.cache[statusId].page ++
            this.cache[statusId].list.push(...data.list)
            this.cache[statusId].count = data.count
            this.cache[statusId].hasNextPage = data.hasNextPage
            this.cache[statusId].loading = false
            this.$forceUpdate()
        },

        reset (status = null) {
            let statusId = status ?? this.tab
            this.cache[statusId].page = 1
            this.cache[statusId].list = []
            this.cache[statusId].count = 0
            this.cache[statusId].hasNextPage = true
            this.cache[statusId].loading = false
        },

        async createDraft () {
            if (!this.cache.template.list.length) {
                await this.requestSurveys("template")
            }

            let terOptions = []
            if (this.user.globalAffiliation) {
                terOptions.push({ id: -1, name: 'На всех территориях' })
            }
            terOptions.push(...this.territories)

            const result = await this.$layer.ask({
                fields: {
                    text: {
                        type: 'const',
                        placeholder: (
                            'Вы создаёте черновик. Если планируете создать шаблон - ' +
                            'продолжите заполнение, перейдите к новому черновику и ' +
                            'нажмите "Превратить черновик в шаблон".'
                        )
                    },
                    territory: {
                        type: 'select',
                        name: 'Территория проведения',
                        options: terOptions,
                        initial: this.user.affiliation,
                        expect: 'value',
                        required: true
                    },
                    name: {
                        type: 'text',
                        name: 'Название',
                        required: true
                    },
                    template: this.cache.template.list ? {
                        type: 'select',
                        name: 'Создать на основе шаблона...',
                        optional: true,
                        options: this.cache.template.list,
                    } : {
                        type: 'const',
                        name: 'Создать на основе шаблона...',
                        optional: true,
                        initial: null,
                        placeholder: 'Пока ещё не создано ни одного шаблона, чтобы выбрать.'
                    },
                    goTo: {
                        type: 'radio',
                        name: 'После создания...',
                        options: {
                            update: 'перейти к редактированию',
                            stay: 'остаться на странице'
                        },
                        initial: 'update',
                        nullable: false,
                    }
                },
                next: 'Создать',
            }, { size: 'normal' })

            if (!result) return

            await Surveys.create({
                name: result.name,
                territory: result.territory.id === -1 ? undefined : { id: result.territory.id },
                template: result.template ? { id: result.template.id } : undefined
            })

            .then(data => {
                if (result.goTo !== 'остаться на странице') {
                    this.$router.push({ path: `/admin/survey/${data.id}?mode=edit` })
                }
                else {
                    this.cache.draft.list.unshift(data)
                }
            })
        },

        //----------------------------------- utilities

        differenceBetween (start, end) {
            const sDate = new Date(start)
            const eDate = new Date(end)

            const months = (
                (eDate.getFullYear() - sDate.getFullYear()) * 12
                +
                (eDate.getMonth() - sDate.getMonth())
            )

            if (months > 0) return `${months} месяц${plural(['','а','ев'], months)}`
            else if (months < 0) return 'некорректные сроки'
            else {
                const days = eDate.getDate() - sDate.getDate() + 1

                if (days > 0) return `${days} ${plural(['день','дня','дней'], days)}`
                else return 'некорректные сроки'
            }
        },

        openSearch () {
            this.$refs.search.raise()
        },

        formFilters () {
            let filter = {}

            // SUGGESTION : may be optimized by caching filters
            if (this.search) {
                filter.ilikeName = this.search
            }
            if (this.filters.statuses?.length) {
                filter.statusesIds = this.filters.statuses.map(s => s.id).join(',')
            }
            if (this.filters.dateType && (this.filters.from || this.filters.to)) {
                filter[this.filters.dateType] = {}
                if (this.filters.from) {
                    filter[this.filters.dateType].from = this.filters.from
                }
                if (this.filters.to) {
                    filter[this.filters.dateType].to = this.filters.to
                }
            }
            if (this.filters.territories?.length) {
                filter.territoriesIds = this.filters.territories.map(t => t.id).join(',')
            }
            if (this.filters.directions?.length) {
                filter.directionsIds = this.filters.directions.map(d => d.id).join(',')
            }
            if (this.filters.onlyOwned) {
                filter.onlyOwned = 1
            }

            return filter
        },

        async _trySearch (page = 1) {
            let filter = this.formFilters()

            if (!this.search && !Object.keys(filter).length) {
                this.searchResults = []
                this.searchResultMeta.nextPage = 1
                this.searchResultMeta.count = 0
                return
            }

            if (page === 1) {
                this.searchResults = []
                this.searchResultMeta.nextPage = 1
                this.searchResultMeta.count = 0
            }

            Surveys.paginated(page, { filter, limit: 10 })

            .then(data => {
                this.searchResultMeta.count = data.count
                this.searchResultMeta.hasNextPage = data.hasNextPage
                this.searchResultMeta.nextPage ++

                this.searchResults.push(...data.list.map(item => {
                    return {
                        id: item.id,
                        url: `/admin/survey/${item.id}`,
                        name: item.name,
                        marked: item.name.replaceAll(RegExp(this.search, 'gi'), '<mark>$&</mark>'),
                        status: item.status,
                        territory: item.territory,
                    }
                }))
            })
        },

        //----------------------------------- status management

        async publish (survey) {
            const agree = await this.$layer.confirm(
                'Вы уверены, что хотите опубликовать этот опрос?\n ' +
                'После подтверждения вы уже не сможете его поменять.\n\n ' +
                'Опрос останется публично доступным для заполнения до тех пор, пока не будет переведёт в статус "Завершен".',
            )
            if (!agree) return

            await Surveys.publish(survey.id)

            this.cache.draft.list.splice(this.cache.draft.list.findIndex(s => s.id === survey.id), 1)
            this.reset('published')
        },

        async complete (survey) {
            const agree = await this.$layer.confirm(
                'Вы уверены, что хотите завершить этот опрос?\n ' +
                'После подтверждения опрос будет скрыт из общего доступа и более не доступен к заполнению.\n\n ' +
                'Если вам нужны текущие результаты прохождения, вы можете экспортировать их без завершения опроса.',
            )
            if (!agree) return

            await Surveys.complete(survey.id)

            this.cache.published.list.splice(this.cache.published.list.findIndex(s => s.id === survey.id), 1)
            this.reset('completed')
        },

        //----------------------------------- export

        toPDF (survey) { Surveys.export.toPDF(survey) },

        checkResponses (survey) {
            if (survey.respondentsCount > 0) return false
            else {
                this.$layer.alert(
                    'Вы пока не можете скачать результаты этого опроса, поскольку его ещё ни разу не прошли.',
                    { style: 'warning' }
                )
                return true
            }
        },

        toPDFRes (survey) {
            if (this.checkResponses(survey)) return
            Surveys.export.toPDFRes(survey)
        },

        toXLSX (survey, filter = false) {
            if (this.checkResponses(survey)) return
            Surveys.export.toXLSX(survey, filter)
        },

        toCSV (survey, filter = false) {
            if (this.checkResponses(survey)) return
            Surveys.export.toCSV(survey, filter)
        }
    }
};
</script>


<style scoped>
#surveys-nav {
    max-height: 144px;
}

.sorting > .admin-select {
    padding: 4px 6px;
    border-radius: 6px;
    background: #F1F1F1;
    -moz-appearance: auto;
    -webkit-appearance: auto;
    transition: .3s;
    cursor: pointer;
}
.sorting > .admin-select:hover { background: #EEE; }
.sorting > .admin-select:active { background: #DDD; }

#tablist {
    justify-content: space-between;
}

#tablist > .tablist-arrow {
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    background: url(/images/arrows/blue-right.svg) no-repeat;
}

#tablist > .tablist-line {
    width: 2px;
    min-width: 2px;
    max-width: 2px;
    height: 36px;
    min-height: 36px;
    max-height: 36px;
    background: #888;
}

.tablist-item > svg {
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
}

.tablist-item.active {
    outline: 3px solid var(--colour-link);
    outline-offset: 2px;
}

.tablist-item.create {
    justify-content: center;
    align-self: center;
    width: auto;
    padding: 10px;
}

.tablist-item.search {
    justify-content: center;
    align-self: center;
    width: auto;
}


#surveys .admin-button {
    width: auto;
}
#surveys .admin-button > svg {
    width: 24px;
    min-width: 24px;
    max-width: 24px;
    height: 24px;
    min-height: 24px;
    max-height: 24px;
}

#surveys .survey-export {
    text-align: left;
}


#survey-search-results {
    display: flex;
    width: 100%;
    height: 600px;
    max-height: 600px;
    padding: 10px 4px;
    border-top: 1px solid #444;
    overflow-y: auto;
    position: relative;
}

#survey-search-results:empty::after {
    content: "Список пуст";
    display: inline-block;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 300px;
    color: #666;
    font-size: 18px;
    text-align: center;
}

.search-result {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 20px;
    border-radius: 10px;
    background: #FFF;
    text-decoration: none;
    transition: .3s;
}
.search-result:hover { background: #EEE; }
.search-result:active { box-shadow: 0 0 4px 0 #444; }

.search-result > .name {
    max-width: 60%;
    font-size: 18px;
    font-weight: bold;
    text-align: left;
}
.search-result > .name > :deep(mark) {
    border-bottom: 1px solid currentColor;
    background: transparent;
    color: var(--colour-link);
}

.search-result > .status {
    font-size: 16px;
    font-weight: bold;
    text-transform: lowercase;
}
.search-result > .status.draft     { color: var(--colour-info    ); }
.search-result > .status.published { color: var(--colour-warning ); }
.search-result > .status.completed { color: var(--colour-negative); }
.search-result > .status.template  { color: var(--colour-generic ); }

.search-result > .space {
    flex-grow: 1;
}

.search-result > .territory {
    color: #444;
    font-size: 16px;
    text-align: right;
}

#survey-search-count {
    display: block;
    width: 100%;
    margin-bottom: 6px;
    font-size: 18px;
    text-align: left;
}
#survey-search-count > em {
    color: var(--colour-link);
    font-weight: bold;
    font-style: normal;
}
</style>
