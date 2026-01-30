export const pt = {
    translation: {
        common: {
            settings: "Configurações",
            language: "Idioma",
            selectLanguage: "Selecione seu idioma preferido",
            back: "Voltar",
            save: "Salvar",
            cancel: "Cancelar",
            saved: "Salvo",
            created: "Criado",
            archived: "Arquivado",
        },
        languages: {
            en: "Inglês",
            pt: "Português",
        },
        sidebar: {
            dashboard: "Painel",
            initiatives: "Iniciativas",
            allInitiatives: "Todas Iniciativas",
            productBacklog: "Backlog de Produto",
            engineeringBacklog: "Backlog de Engenharia",
            squads: "Squads",
            team: "Membros da Equipe",
            backlog: "Backlog",
            sprints: "Sprints",
            calendar: "Calendário",
            releases: "Lançamentos",
            seedData: "Popular Dados",
        },
        settings: {
            title: "Configurações",
            general: "Geral",
            appearance: "Aparência",
            notifications: "Notificações",
        },
        validation: {
            required: "Obrigatório",
            maxLength: "Máximo de {{max}} caracteres",
            atLeastOneEstimate: "Pelo menos uma estimativa deve ser preenchida"
        },
        initiatives: {
            title: "Todas as Iniciativas",
            subtitle: "Visão geral de todos os itens nos ciclos de Produto e Engenharia.",
            listTitle: "Lista de Iniciativas",
            filterPlaceholder: "Filtrar iniciativas...",
            table: {
                title: "Título",
                type: "Tipo",
                priority: "Prioridade",
                phase: "Fase do Ciclo",
                status: "Status Atual",
                empty: "Nenhuma iniciativa encontrada."
            },
            phases: {
                product: "Produto",
                engineering: "Engenharia",
                archived: "Arquivado"
            }
        },
        productBacklog: {
            title: "Backlog de Produto",
            subtitle: "Gerencie iniciativas e descobertas.",
            newInitiative: "Nova Iniciativa",
            searchPlaceholder: "Buscar...",
            columns: {
                discovery: "Descoberta",
                refinement: "Refinamento",
                readyForEng: "Pronto p/ Eng"
            },
            promote: "Promover p/ Engenharia",
            promoteConfirmTitle: "Promover para Backlog de Engenharia?",
            promoteConfirmDesc: "Este item será movido para o status 'Backlog' e ficará visível para a equipe de engenharia.",
            readyMsg: "Itens prontos podem ser promovidos"
        },
        engineeringBacklog: {
            title: "Backlog de Engenharia",
            subtitle: "Gerencie tarefas de implementação e fluxo de sprint.",
            newTask: "Nova Tarefa",
            columns: {
                backlog: "A Fazer (Backlog)",
                inSprint: "No Sprint",
                review: "Revisão / QA",
                done: "Concluído"
            },
            stats: {
                total: "Total no Backlog",
                effort: "Esforço (Pts)",
                bugs: "Bugs",
                highPriority: "Alta Prioridade"
            },
            archive: "Arquivar",
            edit: "Editar",
            dragDrop: "Arraste itens aqui"
        },
        initiativeForm: {
            newTitle: "Nova Iniciativa",
            editTitle: "Editar Iniciativa",
            sections: {
                whatWhy: "O Quê & Por Quê",
                discovery: "Descoberta & Validação"
            },
            fields: {
                title: "Título",
                objective: "Objetivo (Por quê?)",
                userImpact: "Impacto no Usuário (Quem?)",
                businessGoal: "Meta de Negócio / KPI",
                hasPrototype: "Tem Protótipo / Mockups?",
                prototypeLink: "Link do Protótipo",
                type: "Tipo",
                priority: "Prioridade"
            },
            placeholders: {
                objective: "Por que estamos construindo isso? Declaração do problema.",
                userImpact: "Público-alvo e resultado esperado.",
                businessGoal: "ex: Aumentar conversão em 5%",
                prototypeLink: "Figma ou link do recurso",
                title: "Nome da iniciativa"
            },
            save: "Salvar Iniciativa",
            cancel: "Cancelar"
        },
        taskForm: {
            newTitle: "Nova Tarefa",
            editTitle: "Editar Tarefa",
            productContext: {
                title: "Contexto do Produto",
                objective: "Objetivo",
                businessGoal: "Meta de Negócio",
                userImpact: "Impacto no Usuário",
                prototype: "Protótipo",
                viewPrototype: "Ver Protótipo"
            },
            sections: {
                basicInfo: "Informações Básicas",
                dates: "Datas",
                estimates: "Estimativas por Especialidade"
            },
            fields: {
                title: "Título",
                description: "Descrição",
                type: "Tipo",
                priority: "Prioridade",
                startDate: "Data de Início",
                endDate: "Data de Término",
                frontend: "Frontend",
                backend: "Backend",
                qa: "QA",
                design: "Design"
            },
            placeholders: {
                title: "Digite o título da tarefa",
                description: "Digite a descrição (opcional)",
                selectDate: "Selecione uma data"
            },
            totalEffort: "Esforço Total: {{points}} pontos"
        }
    }
};
