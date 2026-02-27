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
            strategy: "Estratégia & Saúde",
            modules: "Módulos & Features",
            documentation: "Documentação",
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
            tabs: {
                general: "Geral",
                details: "Detalhes & Contexto"
            },
            sections: {
                whatWhy: "O Quê & Por Quê",
                discovery: "Descoberta & Validação"
            },
            productContext: "Contexto do Produto",
            fields: {
                title: "Título",
                objective: "Objetivo (Por quê?)",
                userImpact: "Impacto no Usuário (Quem?)",
                businessGoal: "Meta de Negócio / KPI",
                hasPrototype: "Tem Protótipo / Mockups?",
                prototypeLink: "Link do Protótipo",
                type: "Tipo",
                priority: "Prioridade",
                feature: "Funcionalidade do Produto"
            },
            placeholders: {
                objective: "Por que estamos construindo isso? Declaração do problema.",
                userImpact: "Público-alvo e resultado esperado.",
                businessGoal: "ex: Aumentar conversão em 5%",
                prototypeLink: "Figma ou link do recurso",
                title: "Nome da iniciativa",
                selectFeature: "Selecione uma funcionalidade..."
            },
            save: "Salvar Iniciativa",
            cancel: "Cancelar"
        },
        taskForm: {
            newTitle: "Nova Tarefa",
            editTitle: "Editar Tarefa",
            tabs: {
                info: "Informações",
                estimates: "Estimativas"
            },
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
        },
        productModules: {
            title: "Módulos & Funcionalidades",
            subtitle: "Gerencie a hierarquia funcional do seu produto.",
            modules: "Módulos",
            modulesDesc: "Defina as áreas funcionais de alto nível do seu produto.",
            addModule: "Adicionar Módulo",
            newModulePlaceholder: "Nome do Novo Módulo (ex: Checkout)",
            descPlaceholder: "Descrição (opcional)",
            features: "Funcionalidades",
            featuresCount: "{{count}} Funcionalidades",
            addFeature: "Adicionar Funcionalidade",
            newFeaturePlaceholder: "Nome da Nova Funcionalidade...",
            featureDescPlaceholder: "Descrição da Funcionalidade",
            services: "Serviços",
            servicesDesc: "Dependências e Serviços Externos.",
            addService: "Adicionar Serviço",
            serviceNamePlaceholder: "Nome do Serviço...",
            coreServices: "Serviços Principais",
            coreServicesDesc: "Banco de dados, APIs e integrações externas",
            pressEnterToAdd: "Pressione Enter para adicionar",
            typePlaceholder: "Tipo",
            types: {
                internal: "Serviço Interno",
                external: "API Externa",
                database: "Banco de Dados"
            },
            delete: {
                title: "Excluir {{type}}?",
                description: "Tem certeza que deseja excluir '{{name}}'? Esta ação não pode ser desfeita.",
                confirm: "Excluir",
                cancel: "Cancelar",
                module: "Módulo",
                feature: "Funcionalidade",
                service: "Serviço"
            }
        },
        productStrategy: {
            title: "Estratégia & Saúde do Produto",
            subtitle: "Raio-X Estratégico: Saúde técnica vs Esforços de investimento.",
            pickDate: "Selecione uma data",
            newReport: "Novo Relatório",
            tabs: {
                kpi: "Snapshot de KPIs",
                architecture: "Arquitetura & Módulos"
            },
            kpi: {
                healthScore: "Nota de Saúde",
                bugs: "bugs",
                usage: "uso"
            },
            charts: {
                painVsCure: {
                    title: "Análise Dor vs. Cura",
                    description: "Comparando volume de problemas (Vermelho) vs. entregas (Violeta)",
                    bugsReported: "Bugs reportados",
                    initiativesDone: "Iniciativas Concluídas"
                },
                effort: {
                    title: "Distribuição de Esforço",
                    description: "Onde estamos investindo tempo?"
                }
            },
            table: {
                title: "Snapshot Tático",
                columns: {
                    type: "Tipo",
                    title: "Título",
                    module: "Módulo",
                    impact: "Impacto",
                    status: "Status"
                },
                empty: "Nenhuma iniciativa encontrada neste período.",
                estimated: "Est."
            }
        },
        strategyMap: {
            title: "Mapa de Arquitetura",
            subtitle: "Visualizando dependências Módulo -> Funcionalidade -> Serviço",
            resetLayout: "Resetar Layout"
        },
        login: {
            title: "Sprint Planner",
            welcome: "Bem-vindo ao Sprint Planner!",
            googleSuccess: "Login com Google realizado com sucesso.",
            authFailed: "Falha na Autenticação",
            authError: "Ocorreu um erro durante o login.",
            pwdMismatchTitle: "Senhas não conferem",
            pwdMismatchDesc: "Por favor, verifique se as senhas estão iguais antes de continuar.",
            welcomeBack: "Bem-vindo de volta!",
            signedIn: "Login realizado com sucesso.",
            accountCreated: "Conta Criada!",
            welcomePlatform: "Bem-vindo ao Sprint Planner.",
            emailInUse: "Este e-mail já está registrado.",
            invalidCreds: "E-mail ou senha inválidos.",
            userNotFound: "Conta não encontrada. Por favor, registre-se.",
            heroTitle1: "Alinhe sua equipe.",
            heroTitle2: "Entregue mais rápido.",
            heroDesc: "O melhor espaço de gestão de produtos. Da definição da estratégia e roadmaps de features à execução do sprint e PRDs assistidos por IA.",
            strategy: "Estratégia de Produto",
            tracking: "Acompanhamento do Sprint",
            rights: "Sprint Planner. Todos os direitos reservados.",
            titleLogin: "Bem-vindo de volta",
            titleRegister: "Criar uma Conta",
            descLogin: "Entre na sua conta para continuar seu trabalho.",
            descRegister: "Registre-se para uma nova conta e junte-se à sua equipe.",
            fullName: "Nome Completo",
            namePlaceholder: "João da Silva",
            email: "Endereço de E-mail",
            emailPlaceholder: "nome@empresa.com",
            password: "Senha",
            confirmPassword: "Confirmar Senha",
            btnSignIn: "Entrar",
            btnRegister: "Criar Conta",
            orContinue: "Ou continue com",
            continueGoogle: "Continuar com o Google",
            noAccount: "Não tem uma conta?",
            registerHere: "Registre-se aqui",
            hasAccount: "Já tem uma conta?",
            signInHere: "Entrar"
        },
        dashboard: {
            title: "Painel Principal",
            subtitle: "Visão geral do ciclo de desenvolvimento do seu produto.",
            activeSprint: "Sprint Ativo",
            noActiveSprint: "Nenhum Sprint Ativo",
            daysRemaining: "{{days}} dias restantes",
            planNextSprint: "Planejar próximo sprint",
            discoveryQueue: "Fila de Descoberta",
            ideasInDiscovery: "Ideias em descoberta",
            engineeringReady: "Pronto para Engenharia",
            readyForDev: "Pronto para desenvolvimento",
            strategyHealth: "Saúde da Estratégia",
            modulesScore: "Módulos com pontuação >80",
            quickActions: "Ações Rápidas",
            newInitiative: "Nova Iniciativa",
            planSprint: "Planejar Sprint",
            recentActivity: "Atividade Recente",
            latestUpdates: "Últimas atualizações em todo o produto.",
            noActivity: "Nenhuma atividade recente."
        },
        usersManagement: {
            title: "Usuários & Permissões",
            subtitle: "Gerencie acesso ao sistema, cargos e permissões granulares.",
            inviteUser: "Convidar Usuário",
            accessDenied: "Acesso Negado",
            accessDeniedDesc: "Você não tem permissão para visualizar a página de Gerenciamento de Usuários.",
            roleUpdated: "Cargo Atualizado",
            roleChangedTo: "Cargo do usuário alterado para {{role}}",
            userExists: "Usuário Existe",
            userExistsDesc: "Este usuário já está registrado no sistema.",
            invitePrepared: "Convite Preparado",
            invitePreparedDesc: "Quando {{email}} se registrar, será automaticamente um {{role}}.",
            inviteFailed: "Falha ao preparar convite",
            registeredUsers: "Usuários Registrados",
            totalUsers: "Total de usuários: {{count}}",
            table: {
                user: "Usuário",
                joined: "Entrou em",
                role: "Cargo",
                permissions: "Permissões"
            },
            unnamedUser: "Usuário Sem Nome",
            admin: "Admin",
            member: "Membro",
            fullAccess: "Acesso Total",
            configure: "Configurar",
            granularPermissions: "Permissões Granulares",
            configureAccessFor: "Configure níveis de acesso específicos para ",
            featureModule: "Módulo da Funcionalidade",
            noteGranting: "Nota: Conceder permissão de Criar, Editar ou Excluir concede automaticamente a permissão de Visualizar. O salvamento é automático ao marcar as caixas.",
            inviteNewUser: "Convidar Novo Usuário",
            preProvisionRole: "Pré-provisione um cargo para um membro da equipe. Quando ele se inscrever, herdará automaticamente essas configurações.",
            emailAddress: "Endereço de E-mail",
            emailPlaceholder: "nome@empresa.com",
            nameAddress: "Nome",
            namePlaceholder: "Digite o nome do usuário",
            initialRole: "Cargo Inicial",
            cancel: "Cancelar",
            prepareInvitation: "Preparar Convite",
            features: {
                squads: "Squads & Membros",
                initiatives: "Iniciativas",
                backlog: "Backlog de Produto",
                strategy: "Estratégia de Produto",
                sprints: "Sprints"
            },
            actions: {
                view: "Visualizar",
                create: "Criar",
                edit: "Editar",
                delete: "Excluir"
            }
        },
        docs: {
            title: "Hub de Documentação",
            subtitle: "Crie, gerencie e descubra a documentação do produto.",
            new: "Novo Documento",
            searchPlaceholder: "Buscar documentos...",
            emptyTitle: "Nenhum documento encontrado",
            emptyDesc: "Comece criando um novo documento de produto ou usando um dos nossos templates predefinidos.",
            createTitle: "Criar Novo Documento",
            createDesc: "Comece do zero ou escolha um template para começar a escrever.",
            docTitle: "Título do Documento",
            titlePlaceholder: "ex: PRD Gateway de Pagamento Q3",
            templates: "Selecione um Template",
            blankDoc: "Documento em Branco",
            blankDesc: "Comece do zero com uma folha em branco.",
            createBtn: "Criar Documento",
            created: "Documento criado com sucesso",
            createError: "Falha ao criar documento",
            confirmDelete: "Tem certeza que deseja excluir este documento?",
            deleted: "Documento excluído",
            deleteError: "Falha ao excluir",
            notFound: "Documento não encontrado",
            backToHub: "Voltar para o Hub de Documentação",
            lastUpdated: "Última atualização:",
            write: "Escrever",
            preview: "Visualizar",
            editorPlaceholder: "Comece a escrever seu documento usando Markdown...",
            emptyPreview: "Nada para visualizar. Mude para a aba Escrever para adicionar conteúdo."
        }
    }
};
