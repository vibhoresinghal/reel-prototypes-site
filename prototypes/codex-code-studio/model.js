export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function highlight(line){
 const tokens=/(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:import|from|export|const|let|return|function|if|else|type|number|string|boolean|true|false|async|await|new|interface)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\())/g;
 let last=0,result='';for(const match of line.matchAll(tokens)){result+=escapeHTML(line.slice(last,match.index));const text=match[0],kind=text.startsWith('//')?'comment':/^["']/.test(text)?'string':/^\d/.test(text)?'number':/^(import|from|export|const|let|return|function|if|else|type|number|string|boolean|true|false|async|await|new|interface)$/.test(text)?'keyword':'call';result+='<span class="token-'+kind+'">'+escapeHTML(text)+'</span>';last=match.index+text.length;}return result+escapeHTML(line.slice(last));
}
export function exampleCode(count=64){
 const start=["import { motion } from 'motion/react';","",'type Milestone = {','  payment: number;','  reward: number;','  label: string;','};','','// A little progress. A reason to keep going.','const milestones: Milestone[] = ['];
 const end=['];','','export function MilestoneJourney({ completed = 0 }) {','  const current = milestones.findIndex(','    (step) => step.payment > completed','  );','','  return (','    <main className="rewards-journey">','      <header>','        <h1>Every payment takes you further.</h1>','      </header>','      {milestones.map((step, index) => (','        <motion.section','          key={step.payment}','          initial={{ opacity: 0, y: 12 }}','          animate={{ opacity: 1, y: 0 }}','          transition={{ duration: 0.4 }}','          data-active={index === current}','          data-complete={step.payment <= completed}','        >','          <span>{step.label}</span>','          <strong>{step.reward} Cashpoints</strong>','        </motion.section>','      ))}','    </main>','  );','}'];
 const records=[4,7,10,15].map((payment,i)=>`  { payment: ${payment}, reward: 15, label: 'Milestone ${i+1}' },`);
 const body=[...end];body.splice(6,0,'  const earned = milestones.filter(','    (step) => step.payment <= completed','  );','');body.splice(body.indexOf('      </header>'),0,'        <p>{earned.length * 15} Cashpoints earned</p>','        <span>Your next reward is closer.</span>');
 const base=[...start,...records,...body];
 const helpers=[
  ['getNextMilestone', 'pending[0] ?? null'],
  ['getEarnedCashpoints', 'finished.reduce((sum, step) => sum + step.reward, 0)'],
  ['getCompletionRatio', 'Math.min(completed / 15, 1)'],
  ['getPaymentsRemaining', 'Math.max((pending[0]?.payment ?? 15) - completed, 0)'],
  ['getUnlockedRewards', 'finished.map((step) => step.label)'],
  ['getActiveMilestone', 'finished.length'],
  ['isJourneyComplete', 'pending.length === 0'],
  ['getPendingRewards', 'pending.reduce((sum, step) => sum + step.reward, 0)'],
  ['getJourneyLabel', "pending.length ? 'Keep going' : 'All rewards unlocked'"],
  ['getRewardProgress', 'finished.length / milestones.length'],
  ['getLatestReward', 'finished.at(-1) ?? null'],
  ['getUpcomingPayments', 'pending.map((step) => step.payment)'],
  ['getRewardSummary', '{ earned: finished.length, remaining: pending.length }'],
  ['getJourneyState', "pending.length ? 'in-progress' : 'complete'"]
 ];
 const target=Math.max(48,Math.min(160,Math.round(count)));
 for(let i=0;base.length+8<=target;i++){
  const [name,result]=helpers[i];base.push('', '// Keep the UI connected to payment progress.', `export function ${name}(completed: number) {`, '  const finished = milestones.filter((step) => step.payment <= completed);', '  const pending = milestones.filter((step) => step.payment > completed);', '', `  return ${result};`, '}');
 }
 return base.join('\n');
}
export function advancePosition(text,position,budget){
 let next=Math.min(text.length,position+Math.floor(budget));
 // Never expose half of a surrogate pair in custom source text.
 if(next<text.length&&next>0&&/[\uD800-\uDBFF]/.test(text[next-1]))next--;
 return next;
}
