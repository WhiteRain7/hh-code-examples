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
                    name: form.name,
                    path: `/admin/survey/${form.id}`,
                },
                {
                    name: 'Заполнение',
                    unclickable: true,
                    path: '#',
                },
            ]" />


        <main id="form-container">
            <form id="form-content" class="layout-vertical" @submit.prevent="trySubmit">
                <header ref="header" id="form-header">
                    <h1 id="form-title">{{ form.name }}</h1>
                    <p id="form-description" v-if="form.description" v-html="form.description.replaceAll('\n', '<br />')"></p>
                    <p id="form-meta">{{ amount }} {{ plural([ 'вопрос', 'вопроса', 'вопросов' ], amount) }}</p>
                    <p id="form-required">
                        <b>*</b> — вопрос обязателен к заполнению
                    </p>
                    <div class="form-dates" v-if="form.publishedAt">
                        <p>Даты проведения опроса</p>
                        {{ formatDate(form.publishedAt, 'dd.mm.yyyy') }} - {{   form.completedAt ? this.formatDate(form.completedAt, 'dd.mm.yyyy') : ' по н.в.'}}
                    </div>
                    <div class="form-dates" v-else>
                        <p>Дата создания опроса</p>
                        {{
                            formatDate(form.createdAt, 'dd.mm.yyyy')
                        }}
                    </div>

                </header>

                <fieldset
                    v-for="(chapter, index) in form.chapters"
                    v-show="index === current"
                    :key="chapter.id"
                    class="form-chapter"
                    :aria-labelledby="`c${chapter.id}-title`">

                    <div class="form-chapter-header">
                        <h2 :id="`c${chapter.id}-title`">{{ chapter.name }}</h2>

                        <p v-if="chapter.description" v-html="chapter.description.replaceAll('\n', '<br />')"></p>
                    </div>

                    <Question
                        v-for="(q, qindex) in chapter.questions"
                        :key="q.id"
                        ref="qs"
                        :q="q"
                        :qindex="qindex"
                        :chapter="chapter.id"
                        @update="updateState(chapter, $event)" />
                </fieldset>

                <div
                    v-for="(chapter, index) in form.chapters"
                    v-show="index === current"
                    class="form-progress">

                    <h2 class="progress-title">
                        Раздел №{{ current + 1 }} - заполнен{{ plural([ '', 'о', 'ов' ], progress[chapter.id]) }}
                        {{ progress[chapter.id] }} вопрос{{ plural([ '', 'а', 'ов' ], progress[chapter.id]) }}
                        из {{ chapter.questions.length }}
                    </h2>

                    <div
                        class="progress-bar"
                        role="progressbar"
                        :aria-valuenow="progress[chapter.id]"
                        :aria-valuemin="0"
                        :aria-valuemax="chapter.questions.length">

                        <div class="indicator" aria-hidden="true" :style="{ width: `${progress[chapter.id] / chapter.questions.length * 100}%` }"></div>
                    </div>
                </div>

                <nav id="form-controls" class="layout-horizontal j-between">
                    <div class="layout-horizontal">
                        <button
                            type="button"
                            class="form-control"
                            :disabled="current === 0"
                            @click="goBack">

                            Назад
                        </button>

                        <button
                            type="button"
                            class="form-control"
                            :disabled="current + 1 === length"
                            @click="goForth">

                            Далее
                        </button>

                        <p v-if="length > 1">Раздел {{ current + 1 }} из {{ length }}</p>
                    </div>

                    <button type="submit" class="form-control" :disabled="block.blocked">
                        Отправить ответы
                    </button>
                    <div id="survey-copy">
                        <button type="button" class="form-control-copy" @click="copyURL">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.39535 6.41026C1.39535 3.73675 3.38149 1.53846 5.81395 1.53846H10.4651C12.8891 1.53846 14.8837 3.73766 14.8837 6.41026C14.8837 9.08377 12.8976 11.2821 10.4651 11.2821H8.13953C7.75422 11.2821 7.44186 11.6264 7.44186 12.0513C7.44186 12.4761 7.75422 12.8205 8.13953 12.8205H10.4651C13.6699 12.8205 16.2791 9.93162 16.2791 6.41026C16.2791 2.88799 13.6597 0 10.4651 0H5.81395C2.60921 0 0 2.8889 0 6.41026C0 7.96288 0.508799 9.38628 1.34264 10.4918C1.589 10.8185 2.02889 10.8631 2.32515 10.5914C2.62141 10.3198 2.66186 9.83481 2.4155 9.50816C1.77957 8.665 1.39535 7.58584 1.39535 6.41026Z" fill="#0D8876"/>
                                <path d="M5.11628 13.5897C5.11628 10.9162 7.10242 8.71795 9.53488 8.71795H11.8605C12.2458 8.71795 12.5581 8.37355 12.5581 7.94872C12.5581 7.52388 12.2458 7.17949 11.8605 7.17949H9.53488C6.33014 7.17949 3.72093 10.0684 3.72093 13.5897C3.72093 17.112 6.34027 20 9.53488 20H14.186C17.3908 20 20 17.1111 20 13.5897C20 12.0371 19.4912 10.6137 18.6574 9.50816C18.411 9.18151 17.9711 9.13692 17.6748 9.40855C17.3786 9.68019 17.3381 10.1652 17.5845 10.4918C18.2204 11.335 18.6047 12.4142 18.6047 13.5897C18.6047 16.2633 16.6185 18.4615 14.186 18.4615H9.53488C7.1109 18.4615 5.11628 16.2623 5.11628 13.5897Z" fill="#0D8876"/>
                            </svg>
                            <span>Поделиться опросом</span>
                        </button>
                        <div id="is-copied-noties">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.99999 3.82688C7.34344 3.82688 7.62186 4.1053 7.62186 4.44875V7.63781C7.62186 7.98126 7.34344 8.25968 6.99999 8.25968C6.65654 8.25968 6.37812 7.98126 6.37812 7.63781V4.44875C6.37812 4.1053 6.65654 3.82688 6.99999 3.82688Z" fill="#E32C2C"/>
                                <path d="M6.99649 8.92907C6.65304 8.92907 6.37462 9.20749 6.37462 9.55094C6.37462 9.89439 6.65304 10.1728 6.99649 10.1728H7.00222C7.34566 10.1728 7.62408 9.89439 7.62408 9.55094C7.62408 9.20749 7.34566 8.92907 7.00222 8.92907H6.99649Z" fill="#E32C2C"/>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M0 7C0 3.14858 3.14858 0 7 0C10.8514 0 14 3.14858 14 7C14 10.8514 10.8514 14 7 14C3.14858 14 0 10.8514 0 7ZM7 1.24374C3.83548 1.24374 1.24374 3.83548 1.24374 7C1.24374 10.1645 3.83548 12.7563 7 12.7563C10.1645 12.7563 12.7563 10.1645 12.7563 7C12.7563 3.83548 10.1645 1.24374 7 1.24374Z" fill="#E32C2C"/>
                            </svg>
                            <span>Ссылка скопирована в буфер обмена!</span>
                        </div>
                    </div>
                </nav>
            </form>

            <ModalForm ref="form" max-width="600px" header="Ошибка при отправке">
                <p id="survey-error-message">{{ errorMessage }}</p>
            </ModalForm>
        </main>
    </div>
</template>

<script>
import { Surveys } from "~/plugins/api/surveys"
import { formatted_title, plural, formatDate } from "~/plugins/scripts/utils"

export default {
    name: "SurveyFill",

    middleware: [ 'survey/@link' ],

    layout: "empty",

    components: {
        ModalForm: () => import('~/components/controls/ModalForm'),
        Question: () => import('~/components/surveys/fill/Question'),
    },

    data () {
        const form = this.$store.state.surveyForm

        if (form.error) return { error: form.error, form: {}, block: {}, amount: 0, current: 0 }

        const block = {
            blocked: false,
            message: '',
            colour: '',
        }

        if (form.completedAt) {
            block.blocked = true
            block.message = 'Опрос завершён'
            block.colour = '#E32C2C'
        }
        else {
            const passedBefore = localStorage.getItem(`srv.${form.link}-cmpltat`)
            const mayRepass = this.$store.state.user.permissions.has('survey:response-many')

            if (!mayRepass && passedBefore) {
                let time = ''
                if (!isNaN(passedBefore)) {
                    time = formatDate(new Date(Number(passedBefore)), ' dd.mm.yyyy в HH:MM')
                }

                block.blocked = true
                block.message = 'Опрос пройден' + time
                block.colour = '#0b7e14'
            }
        }

        let progress = {}
        for (let chapter of form.chapters) progress[chapter.id] = 0

        return {
            error: null,
            form,
            amount: form.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0),
            current: 0,
            length: form.chapters.length,
            progress,

            canViewAsAdmin: this.$store.state.user.can.view.survey,

            passedAt: localStorage.getItem(`survey-${form.id}-passed`) === 'true',

            block,
            errorMessage: ''
        }
    },

    head () {
        return { title: formatted_title(this.form?.name ?? 'Ошибка', 'Форма') }
    },

    mounted () {
        window.addEventListener('beforeprint', event => {
            if (this.$route.path === `/admin/survey/${this.form.id}/${this.form.link}`) {
                event.preventDefault()
                this.print()
            }
        })
    },

    methods: {
        plural,
        formatDate,

        updateState (chapter, state) {
            this.progress[chapter.id] += state ? 1 : -1
        },

        goBack () {
            if (this.current > 0) {
                this.current --
                this.$refs.header.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
            }
        },

        async copyURL() {
            try {
                await navigator.clipboard.writeText(window.location);
                document.getElementById('is-copied-noties').classList.add('visible')
                setTimeout(() => {
                    document.getElementById('is-copied-noties').classList.remove('visible')
                }, 5000)
            } catch($e) {
                console.error('Не удалось скопировать ссылку по причине:', $e)
            }
        },

        goForth () {
            let firstErrored = null

            for (let vueElem of this.$refs.qs.filter(e => e.chapter === this.form.chapters[this.current].id)) {
                let state = vueElem.check()
                if (!state && !firstErrored) firstErrored = vueElem
            }

            if (firstErrored) {
                this.$nextTick(() => {
                    firstErrored.$el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
                })
                return
            }

            if (this.current + 1 < this.length) {
                this.current ++
                this.$refs.header.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
            }
        },

        async trySubmit () {
            let firstErrored = null

            for (let vueElem of this.$refs.qs) {
                let state = vueElem.check()

                if (!state && !firstErrored) firstErrored = vueElem
            }

            if (firstErrored) {
                this.current = this.form.chapters.findIndex(c => c.id === firstErrored.chapter)
                this.$nextTick(() => {
                    firstErrored.$el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
                })
                return
            }

            let data = []

            for (let vueElem of this.$refs.qs) {
                let value = vueElem.collect()
                if (value) data.push(value)
            }

            const success = await Surveys.send(this.form.id, data)
                .then(() => true)
                .catch(async e => {
                    this.errorMessage = (await e.response?.json()).message ?? 'Неизвестная ошибка'
                    this.$refs.form.raise()
                    return false
                })

            if (!success) return

            for (let vueElem of this.$refs.qs) {
                vueElem.reset()
            }
            this.current = 0
            scrollTo(0, 0)
            this.$notifications.notify('Форма отправлена', { state: 'success', closeAfter: 3000 })
        },

        print () {
            window.open(`/admin/survey/${this.form.id}/print`, '_blank')
        }
    }
};
</script>

<style scoped>
.layout-vertical {
    align-items: start;
}

#form-content fieldset .layout-vertical {
    gap: 12px;
}

#form-container {
    box-sizing: border-box;
    width: 100%;
    padding: 40px 20px;
    background: #F6F6F6;
    max-width: 1400px;
    margin: 0 auto;
    color: var(--color-survey-base_05);
}

.page-title {
    width: 100%;
    background-color: #EAEAEA;
    padding: 8px 24px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.badge {
    display: inline-block;
    background-color: var(--local-colour, var(--color-survey-accent));
    color: #FFFFFF;
    font-size: 16px;
    line-height: 20px;
    border-radius: 4px;
    padding: 10px;
    text-transform: uppercase;
}


#form-content {
    width: 100%;
    /*max-width: 800px;
    margin: auto;*/
    background-color: #FFFFFF;
    padding: 24px;
    border-radius: 8px;
}

.form-delimiter {
    width: 100%;
    height: 1px;
    min-height: 1px;
    max-height: 1px;
    background: #BBB;
}

#form-header,
.form-chapter,
.form-progress,
#form-controls {
    width: 100%;
}

.form-chapter-header h2 {
    font-size: 18px;
    font-weight: 700;
}

.form-chapter-header p {
    color: var(--color-survey-base_02);
    margin-top: 8px;
    font-size: 15px;
}

#form-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-top: 1px solid var(--color-survey-base_03);
    border-bottom: 1px solid var(--color-survey-base_03);
    padding: 24px 0;
    width: 100%;
    max-width: 800px;
}

#form-title {
    color: #151515;
    font-size: 24px;
    line-height: 28px;
    font-weight: 700;
}

#form-description {
    font-size: 16px;
    line-height: 20px;
}

.form-dates {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-dates > p {
    font-size: 14px;
    line-height: 16px;
    color: #B3B3B3;
}

.form-chapter {
    display: flex;
    flex-direction: column;
    row-gap: 20px;
}

.form-progress h2 {
    margin-bottom: 12px;
}

.progress-bar {
    width: 100%;
    height: 20px;
    min-height: 20px;
    max-height: 20px;
    background: var(--color-survey-base_03)
}
.progress-bar > .indicator {
    height: 100%;
    background: var(--color-survey-accent_01);
    transition: width .5s ease-out;
}

.form-control {
    background: #FFF;
}

#aside-controls {
    position: fixed;
    right: 10px;
    bottom: 10px;
    width: auto;
}
#aside-controls > a {
    height: 48px;
    padding: 8px;
    border-radius: 666px;
    background: #FFF;
    box-shadow: 0 0 10px 0 #CCC;
    font-size: 0;
    transition: .3s;
}
#aside-controls > a:hover {
    background: #EEE;
}
#aside-controls > a:active {
    box-shadow: 0 0 10px 0 #444;
}
#aside-controls > a > svg {
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    fill: #444;
}

#form-controls button {
    border-radius: 4px;
    padding: 12px 32px;
    display: flex;
    text-wrap: nowrap;
}


#form-controls button.form-control {
    background-color: var(--color-survey-accent_01);
    color: var(--color-survey-base_01);
}

#form-controls button.form-control:hover {
    filter: brightness(1.1)
}

#form-controls button.form-control-copy {
    color: var(--color-survey-accent_01);
    background-color: var(--color-survey-base_01);
    border: 1px solid var(--color-survey-accent_01);
    gap: 8px;
    position: relative;
}

#form-controls button.form-control-copy:hover {
    background-color: var(--color-survey-accent_01);
    color: var(--color-survey-base_01);
}

#form-controls button.form-control-copy svg {
    fill: var(--color-survey-accent_01);
}

#form-controls button.form-control-copy:hover svg {
    fill: var(--color-survey-base_01);
}

#survey-copy {
    position: relative;
}

#is-copied-noties {
    position: absolute;
    right: 0;
    bottom: calc(100% + 4px);
    font-size: 14px;
    line-height: 16px;
    background-color: var(--color-survey-base_06);
    color: var(--color-survey-base_01);
    padding: 6px 16px;
    border-radius: 8px;
    width: auto;
    display: flex;
    gap: 12px;
    align-items: center;
    transition:
        visibility 1s,
        bottom 1s ease,
        opacity 1s ease-out;
    touch-action: none;
}

#is-copied-noties svg {
    width: 16px;
    min-width: 16px;
    max-width: 16px;
    height: 16px;
    min-height: 16px;
    max-height: 16px;
    fill: var(--color-survey-accent);
}

#is-copied-noties:not(.visible) {
    bottom: 0;
    opacity: 0;
    visibility: hidden;
}

@media screen and (max-width: 1000px) {
    #form-container {
        font-size: 14px;
        line-height: 16px;
    }

    .page-title {
        width: 100%;
        padding: 0;
        border-radius: 8px;
        margin-bottom: 20px;
    }

    .badge {
        border-radius: 8px;
        padding: 8px 24px;
        width: 100%;
    }

    #form-header {
        padding: 16px 0;
    }

    .form-dates > p {
        font-size: 13px;
    }

    #form-title {
        font-size: 18px;
        line-height: auto;
    }

    .form-chapter-header h2 {
        font-size: 16px;
        line-height: 20px;
    }


}
@media screen and (max-width: 800px) {
    #form-controls {
        flex-direction: column;
        align-items: start;
    }

    #form-controls button,
    #form-controls #survey-copy {
        width: 100%;
    }

    .form-control {
        justify-content: center;
        text-align: center;
    }
}


#form-missing-container {
    width: 100%;
}
#form-missing-text {
    padding: 100px 30px;
    font-size: 30px;
    color: #666;
    text-align: center;
}
</style>
