# Aplicativo de Registro de Ocorrências de SST

## Descrição
Este é um aplicativo web de página única desenvolvido para registrar ocorrências de acidentes e incidentes no trabalho, com dashboards integrados para análise estatística e visualização de dados.

## Funcionalidades Principais

### 1. Registro de Ocorrências
- **Formulário completo** com todos os campos padronizados:
  - ID (automático e incremental)
  - Data e horário
  - Localização
  - Categoria (Queda, Choque, Desvio, Corte, Fratura, Outro)
  - Gravidade (Leve, Moderada, Grave)
  - Tipo (Acidente/Incidente)
  - Alto Potencial (checkbox)
  - Parte do Corpo afetada
  - Descrição detalhada
  - Gerência Responsável

### 2. Armazenamento Local
- Utiliza **localStorage** do navegador para persistência dos dados
- Não requer servidor ou banco de dados externo
- Dados mantidos entre sessões do navegador

### 3. Dashboards Interativos
- **Resumo Estatístico**: Cards com totais de ocorrências, acidentes, incidentes, alto potencial e graves
- **Gráfico de Ocorrências por Mês**: Linha temporal mostrando tendências
- **Distribuição por Tipo**: Gráfico de rosca (Acidente vs Incidente)
- **Ocorrências por Categoria**: Gráfico de barras
- **Distribuição por Gravidade**: Gráfico de pizza
- **Ocorrências por Localização**: Gráfico de barras horizontais
- **Ocorrências por Parte do Corpo**: Gráfico de rosca

### 4. Gráfico de Controle C-Chart
- **Análise estatística avançada** com cálculo automático de:
  - Linha Central (CL) - média das ocorrências
  - Limite Superior de Controle (UCL)
  - Limite Inferior de Controle (LCL)
- **Destaque visual** para pontos fora de controle (em vermelho)
- Útil para identificar variações anômalas no processo

### 5. Sistema de Filtros
- Filtros por **Ano**, **Mês**, **Categoria** e **Localização**
- Aplicação dinâmica dos filtros em todos os gráficos
- Botões para aplicar e limpar filtros

## Como Usar

### Primeira Utilização
1. Abra o arquivo `index.html` em qualquer navegador moderno
2. Clique no botão **"Gerar 300 Ocorrências de Exemplo"** para popular o sistema com dados de teste
3. Explore os dashboards e gráficos gerados

### Registrar Nova Ocorrência
1. Preencha todos os campos obrigatórios no formulário
2. Clique em **"Registrar Ocorrência"**
3. Os dashboards serão atualizados automaticamente

### Usar Filtros
1. Na seção de dashboards, selecione os filtros desejados
2. Clique em **"Aplicar Filtros"**
3. Todos os gráficos serão atualizados com os dados filtrados
4. Use **"Limpar Filtros"** para voltar à visualização completa

### Interpretar o C-Chart
- **Pontos verdes/azuis**: Ocorrências dentro do controle estatístico
- **Pontos vermelhos**: Ocorrências fora de controle (requerem investigação)
- **Linhas tracejadas**: Limites de controle estatístico
- **Linha central**: Média histórica de ocorrências

## Características Técnicas

### Tecnologias Utilizadas
- **HTML5** para estrutura
- **CSS3** para estilização e responsividade
- **JavaScript ES6+** para funcionalidades
- **Chart.js** para visualizações
- **Day.js** para manipulação de datas

### Compatibilidade
- Funciona em todos os navegadores modernos
- Responsivo para desktop e tablets
- Não requer conexão com internet após carregamento inicial

### Armazenamento
- Dados salvos no localStorage do navegador
- Capacidade para milhares de registros
- Backup manual possível exportando dados do localStorage

## Público-Alvo
- Técnicos e engenheiros de segurança do trabalho
- Supervisores e gerentes de operações
- Auditores e analistas de indicadores de SST
- Profissionais de SESMT

## Limitações
- Não inclui análise de causas
- Não possui sistema de planos de ação
- Não tem gestão de responsáveis/usuários
- Não integra com bancos de dados externos
- Dados limitados ao navegador local

## Suporte
Este aplicativo foi desenvolvido como uma solução completa e autônoma. Para modificações ou melhorias, o código está totalmente contido no arquivo `index.html` e pode ser editado conforme necessário.

